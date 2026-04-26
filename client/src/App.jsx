import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { RoleProvider } from './context/RoleContext';
import AppRoutes from './routes/AppRoutes';
import BottomNav from './components/layout/BottomNav';

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <RoleProvider>
        <AppRoutes />
        <BottomNav />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#1c1917',
              color: '#f5f5f4',
              borderRadius: '12px',
              fontSize: '14px',
              fontFamily: '"DM Sans", sans-serif',
            },
            success: { iconTheme: { primary: '#45B34A', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </RoleProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
