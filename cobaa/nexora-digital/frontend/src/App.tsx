import { AppRoutes } from "./routes";
import { AuthContext } from "./hooks/auth-context";
import { useProvideAuth } from "./hooks/useAuth";

export default function App() {
  const auth = useProvideAuth();
  return (
    <AuthContext.Provider value={auth}>
      <AppRoutes />
    </AuthContext.Provider>
  );
}
