// src/layouts/DashboardLayout.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { collection, query, where, onSnapshot } from "firebase/firestore";

import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  Typography,
  Badge,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import TwoWheelerIcon from "@mui/icons-material/TwoWheeler";
import LogoutIcon from "@mui/icons-material/Logout";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";

import logo from "../assets/icon.png";

const drawerWidth = 240;

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState({
    users: 0,
    trucks: 0,
    support: 0,
  });

  // Listener pour les messages de support non lus
  useEffect(() => {
    const q = query(
      collection(db, "supportChats"),
      where("unreadByAdmin", "==", true)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications((prev) => ({ ...prev, support: snapshot.size }));
    });
    return () => unsubscribe();
  }, []);

  // Listener pour les nouvelles commandes et réservations
  useEffect(() => {
    const ordersQuery = query(
      collection(db, "orders"),
      where("viewedByAdmin", "==", false)
    );
    const reservationsQuery = query(
      collection(db, "reservations"),
      where("viewedByAdmin", "==", false)
    );

    let ordersCount = 0;
    let reservationsCount = 0;

    const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
      ordersCount = snapshot.size;
      setNotifications((prev) => ({
        ...prev,
        trucks: ordersCount + reservationsCount,
      }));
    });

    const unsubReservations = onSnapshot(reservationsQuery, (snapshot) => {
      reservationsCount = snapshot.size;
      setNotifications((prev) => ({
        ...prev,
        trucks: ordersCount + reservationsCount,
      }));
    });

    return () => {
      unsubOrders();
      unsubReservations();
    };
  }, []);

  // Listener pour les nouveaux utilisateurs (clients + pros)
  useEffect(() => {
    const usersQuery = query(
      collection(db, "users"),
      where("viewedByAdmin", "==", false)
    );
    const driversQuery = query(
      collection(db, "drivers"),
      where("viewedByAdmin", "==", false)
    );

    let usersCount = 0;
    let driversCount = 0;

    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      usersCount = snapshot.size;
      setNotifications((prev) => ({
        ...prev,
        users: usersCount + driversCount,
      }));
    });
    const unsubDrivers = onSnapshot(driversQuery, (snapshot) => {
      driversCount = snapshot.size;
      setNotifications((prev) => ({
        ...prev,
        users: usersCount + driversCount,
      }));
    });

    return () => {
      unsubUsers();
      unsubDrivers();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/"); // Redirige vers la page de connexion
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
    }
  };

  const menuItems = [
    {
      text: "Utilisateurs",
      icon: <PeopleIcon />,
      path: "/dashboard",
      notificationCount: notifications.users,
    },
    {
      text: "Food Trucks",
      icon: <TwoWheelerIcon />,
      path: "/dashboard/trucks",
      notificationCount: notifications.trucks,
    },
    {
      text: "Support",
      icon: <SupportAgentIcon />,
      path: "/dashboard/support",
      notificationCount: notifications.support,
    },
  ];

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Tableau de Bord Admin
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
            backgroundColor: "background.paper",
          },
        }}
      >
        <Toolbar>
          <img src={logo} alt="Logo" style={{ height: 40, marginRight: 10 }} />
          <Typography variant="h6" color="primary">
            FoodTrucks
          </Typography>
        </Toolbar>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
          }}
        >
          <List>
            {menuItems.map((item) => (
              <ListItem
                key={item.text}
                disablePadding
                onClick={() => navigate(item.path)}
              >
                <ListItemButton>
                  <ListItemIcon sx={{ color: "primary.main" }}>
                    <Badge
                      color="error"
                      variant="dot"
                      invisible={item.notificationCount === 0}
                    >
                      {item.icon}
                    </Badge>
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <List>
            <ListItem disablePadding onClick={handleLogout}>
              <ListItemButton>
                <ListItemIcon>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary="Déconnexion" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, backgroundColor: "background.default" }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
