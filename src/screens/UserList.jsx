// src/screens/UserList.js

import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";

import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersQuery = getDocs(collection(db, "users"));
        const driversQuery = getDocs(collection(db, "drivers"));
        const [usersSnapshot, driversSnapshot] = await Promise.all([
          usersQuery,
          driversQuery,
        ]);

        const clients = usersSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            displayName: `${data.prenom || ""} ${data.nom || ""}`.trim(),
            type: "Client",
          };
        });

        const pros = driversSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            displayName:
              data.nomFoodtruck !== "Nom à définir"
                ? data.nomFoodtruck
                : "Pro sans nom",
            type: "Pro",
          };
        });

        const combinedUsers = [...clients, ...pros];
        setUsers(combinedUsers);
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des utilisateurs:",
          error
        );
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleMenuClick = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  // --- CORRIGÉ ---
  // Démarrer une conversation ré-ouvre le chat s'il était fermé
  const handleContactUser = async () => {
    if (!selectedUser) return;

    const chatDocRef = doc(db, "supportChats", selectedUser.id);

    try {
      await setDoc(
        chatDocRef,
        {
          lastMessageTimestamp: serverTimestamp(),
          type: selectedUser.type,
          userEmail: selectedUser.email,
          status: "open", // <-- CORRECTION CLÉ : On s'assure que la conversation est ouverte
          ...(selectedUser.type === "Pro"
            ? { proId: selectedUser.id, proName: selectedUser.displayName }
            : { userId: selectedUser.id, userName: selectedUser.displayName }),
        },
        { merge: true }
      );

      navigate("/support");
    } catch (error) {
      console.error("Erreur lors de la création de la conversation:", error);
      alert("Impossible de démarrer la conversation.");
    }

    handleMenuClose();
  };

  const handleToggleUserStatus = async () => {
    if (!selectedUser) return;

    const collectionName = selectedUser.type === "Pro" ? "drivers" : "users";
    const userRef = doc(db, collectionName, selectedUser.id);

    try {
      const newStatus = !selectedUser.disabled;
      await updateDoc(userRef, {
        disabled: newStatus,
      });

      setUsers(
        users.map((u) =>
          u.id === selectedUser.id ? { ...u, disabled: newStatus } : u
        )
      );
    } catch (error) {
      console.error("Erreur de mise à jour du statut:", error);
    }

    handleMenuClose();
  };

  const handleManageAdminRole = async (makeAdmin) => {
    if (!selectedUser) return;

    const manageAdminRole = httpsCallable(functions, "manageAdminRole");
    try {
      const result = await manageAdminRole({
        email: selectedUser.email,
        makeAdmin: makeAdmin,
        userType: selectedUser.type,
      });

      setUsers(
        users.map((u) =>
          u.id === selectedUser.id ? { ...u, isAdmin: makeAdmin } : u
        )
      );

      alert(result.data.message);
    } catch (error) {
      console.error("Erreur lors de la gestion du rôle admin:", error);
      alert("Erreur: " + error.message);
    }

    handleMenuClose();
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ width: "100%", overflow: "hidden" }}>
      <Typography variant="h4" sx={{ p: 2 }}>
        Gestion des Utilisateurs
      </Typography>
      <TableContainer sx={{ maxHeight: "calc(100vh - 128px)" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Nom d'affichage</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow hover key={user.id}>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    {user.isAdmin && (
                      <AdminPanelSettingsIcon color="primary" sx={{ mr: 1 }} />
                    )}
                    {user.displayName || user.email || "Non défini"}
                  </Box>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    label={user.type}
                    color={user.type === "Pro" ? "primary" : "secondary"}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.disabled ? "Désactivé" : "Actif"}
                    color={user.disabled ? "error" : "success"}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={(e) => handleMenuClick(e, user)}>
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleContactUser}>Contacter</MenuItem>
        <MenuItem onClick={handleToggleUserStatus}>
          {selectedUser?.disabled
            ? "Activer le compte"
            : "Désactiver le compte"}
        </MenuItem>
        {selectedUser?.isAdmin ? (
          <MenuItem onClick={() => handleManageAdminRole(false)}>
            Révoquer Admin
          </MenuItem>
        ) : (
          <MenuItem onClick={() => handleManageAdminRole(true)}>
            Nommer Admin
          </MenuItem>
        )}
      </Menu>
    </Paper>
  );
}
