import { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  HiOutlineTrendingUp, 
  HiOutlineUserGroup, 
  HiOutlineCurrencyDollar,
  HiOutlineCheckCircle,
  HiOutlineRefresh
} from 'react-icons/hi';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import './AnalyticsManager.css';

// Register ChartJS elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AnalyticsManager() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/analytics/kpis');
      setData(res);
      setError(null);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('No se pudo cargar la información de analítica');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="analytics-loader">
        <div className="spinner" />
        <p>Generando reportes gráficos y analítica...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="analytics-error">
        <p>{error || 'Ocurrió un error inesperado'}</p>
        <button className="btn btn--primary" onClick={fetchAnalytics}>
          <HiOutlineRefresh style={{ marginRight: 8 }} /> Reintentar
        </button>
      </div>
    );
  }

  const { kpis, charts } = data;

  // Chart 1: Services Line Chart
  const servicesChartData = {
    labels: charts.servicesChart.map(item => {
      // Format date to local/short
      const parts = item.date.split('-');
      return `${parts[2]}/${parts[1]}`;
    }),
    datasets: [
      {
        fill: true,
        label: 'Servicios Solicitados',
        data: charts.servicesChart.map(item => item.count),
        borderColor: 'rgb(6, 182, 212)',
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        tension: 0.4,
        pointBackgroundColor: 'rgb(6, 182, 212)',
        pointHoverRadius: 7,
      }
    ]
  };

  // Chart 2: Earnings Bar Chart
  const earningsChartData = {
    labels: charts.earningsChart.map(item => {
      const parts = item.date.split('-');
      return `${parts[2]}/${parts[1]}`;
    }),
    datasets: [
      {
        label: 'Recaudación (Bs.)',
        data: charts.earningsChart.map(item => item.monto),
        backgroundColor: 'rgba(16, 185, 129, 0.75)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
        borderRadius: 4,
      }
    ]
  };

  // Chart Options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#fff',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: 'var(--text-secondary)',
          font: { size: 11 }
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: 'var(--text-secondary)',
          font: { size: 11 },
          stepSize: 1
        }
      }
    }
  };

  const completionRate = kpis.totalServicios30Days > 0 
    ? ((kpis.completedServicios30Days / kpis.totalServicios30Days) * 100).toFixed(0) 
    : 0;

  return (
    <div className="analytics-container animate-fade-in">
      {/* Title Header */}
      <div className="analytics-header">
        <div>
          <h2 className="analytics-title">Dashboard Analítico</h2>
          <p className="analytics-subtitle">Estadísticas operativas, volumen de viajes y recaudación de Plus Móvil</p>
        </div>
        <button className="btn btn--secondary" onClick={fetchAnalytics}>
          <HiOutlineRefresh style={{ marginRight: 8 }} />
          Actualizar Datos
        </button>
      </div>

      {/* KPI Cards */}
      <div className="analytics-kpi-grid">
        <div className="analytics-kpi-card glass-card">
          <div className="kpi-card__icon kpi-card__icon--cyan">
            <HiOutlineTrendingUp />
          </div>
          <div className="kpi-card__content">
            <span className="kpi-card__label">Servicios (30 días)</span>
            <span className="kpi-card__value">{kpis.totalServicios30Days}</span>
            <span className="kpi-card__subtext">Registrados en total</span>
          </div>
        </div>

        <div className="analytics-kpi-card glass-card">
          <div className="kpi-card__icon kpi-card__icon--green">
            <HiOutlineCheckCircle />
          </div>
          <div className="kpi-card__content">
            <span className="kpi-card__label">Efectividad</span>
            <span className="kpi-card__value">{completionRate}%</span>
            <span className="kpi-card__subtext">{kpis.completedServicios30Days} viajes finalizados</span>
          </div>
        </div>

        <div className="analytics-kpi-card glass-card">
          <div className="kpi-card__icon kpi-card__icon--yellow">
            <HiOutlineCurrencyDollar />
          </div>
          <div className="kpi-card__content">
            <span className="kpi-card__label">Recaudación (30 días)</span>
            <span className="kpi-card__value">{kpis.totalEarnings30Days} Bs.</span>
            <span className="kpi-card__subtext">Por cobros de turnos y multas</span>
          </div>
        </div>

        <div className="analytics-kpi-card glass-card">
          <div className="kpi-card__icon kpi-card__icon--purple">
            <HiOutlineUserGroup />
          </div>
          <div className="kpi-card__content">
            <span className="kpi-card__label">Flota Activa</span>
            <span className="kpi-card__value">{kpis.activeChoferes}</span>
            <span className="kpi-card__subtext">Conductores y {kpis.totalClientes} clientes</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="analytics-charts-grid">
        {/* Services Line Chart */}
        <div className="chart-card glass-card">
          <h3 className="chart-card__title">Servicios por Día (Últimos 7 Días)</h3>
          <div className="chart-wrapper">
            <Line data={servicesChartData} options={chartOptions} />
          </div>
        </div>

        {/* Earnings Bar Chart */}
        <div className="chart-card glass-card">
          <h3 className="chart-card__title">Ingresos diarios (Bs.)</h3>
          <div className="chart-wrapper">
            <Bar data={earningsChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Leaderboard Section */}
      <div className="analytics-leaderboard-container glass-card">
        <h3 className="leaderboard-title">Top 5 Conductores con Más Servicios</h3>
        <p className="leaderboard-subtitle">Ranking de conductores con mayor rendimiento en la plataforma</p>
        
        <div className="leaderboard-list">
          {charts.leaderboard.map((item, index) => {
            const colors = ['#f59e0b', '#94a3b8', '#b45309', '#6366f1', '#10b981'];
            const color = colors[index] || '#64748b';
            
            return (
              <div key={index} className="leaderboard-item">
                <div className="leaderboard-item__position" style={{ backgroundColor: color }}>
                  {index + 1}
                </div>
                <div className="leaderboard-item__name">{item.driverName}</div>
                <div className="leaderboard-item__progress-bar">
                  <div 
                    className="leaderboard-item__progress" 
                    style={{ 
                      width: `${(item.count / (charts.leaderboard[0]?.count || 1)) * 100}%`,
                      backgroundColor: 'var(--accent-cyan)' 
                    }}
                  />
                </div>
                <div className="leaderboard-item__count"><strong>{item.count}</strong> viajes</div>
              </div>
            );
          })}
          {charts.leaderboard.length === 0 && (
            <div className="leaderboard-empty">
              No hay datos suficientes de viajes para generar el ranking de conductores.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
