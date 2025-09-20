// src/App.jsx

import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./App.css";

import DashboardLayout from "./layouts/DashboardLayout.jsx";
import LoginScreen from "./screens/LoginScreen.jsx";
import UserList from "./screens/UserList.jsx";
import TruckList from "./screens/TruckList.jsx";
import TruckDetail from "./screens/TruckDetail.jsx";
import ChatDashboard from "./screens/ChatDashboard.jsx";

const router = createBrowserRouter([
  {
    // La page de connexion est maintenant la page par défaut
    path: "/",
    element: <LoginScreen />,
  },
  {
    // Le tableau de bord est accessible via "/dashboard"
    path: "/dashboard",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <UserList /> },
      { path: "trucks", element: <TruckList /> },
      { path: "trucks/:truckId", element: <TruckDetail /> },
      { path: "support", element: <ChatDashboard /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;