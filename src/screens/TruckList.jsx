// src/screens/TruckList.js

import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
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

export default function TruckList() {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTruck, setSelectedTruck] = useState(null);

  const fetchTrucks = async () => {
    setLoading(true);
    try {
      const driversSnapshot = await getDocs(collection(db, "drivers"));
      const trucksData = driversSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTrucks(trucksData);
    } catch (error) {
      console.error("Erreur lors de la récupération des food trucks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrucks();
  }, []);

  const handleMenuClick = (event, truck) => {
    setAnchorEl(event.currentTarget);
    setSelectedTruck(truck);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTruck(null);
  };

  const handleToggleStatus = async () => {
    if (!selectedTruck) return;

    const truckRef = doc(db, "drivers", selectedTruck.id);
    const newStatus = !selectedTruck.disabled;

    try {
      await updateDoc(truckRef, { disabled: newStatus });
      setTrucks(
        trucks.map((t) =>
          t.id === selectedTruck.id ? { ...t, disabled: newStatus } : t
        )
      );
    } catch (error) {
      console.error("Erreur de mise à jour du statut du pro:", error);
    }

    handleMenuClose();
  };

  const viewTruckDetails = () => {
    if (selectedTruck) {
      navigate(`/trucks/${selectedTruck.id}`);
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
        Gestion des Food Trucks
      </Typography>
      <TableContainer sx={{ maxHeight: "calc(100vh - 128px)" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Nom du Food Truck</TableCell>
              <TableCell>Email</TableCell>
              {/* NOUVEAU : Ajout de la colonne Spécialité */}
              <TableCell>Spécialité</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trucks.map((truck) => (
              <TableRow hover key={truck.id}>
                <TableCell>{truck.nomFoodtruck || "Non défini"}</TableCell>
                <TableCell>{truck.email}</TableCell>
                {/* NOUVEAU : Affichage de la spécialité */}
                <TableCell>{truck.specialite || "Non définie"}</TableCell>
                <TableCell>
                  <Chip
                    label={truck.disabled ? "Désactivé" : "Actif"}
                    color={truck.disabled ? "error" : "success"}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={(e) => handleMenuClick(e, truck)}>
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
        <MenuItem onClick={viewTruckDetails}>Voir les détails</MenuItem>
        <MenuItem onClick={handleToggleStatus}>
          {selectedTruck?.disabled
            ? "Activer le compte"
            : "Désactiver le compte"}
        </MenuItem>
      </Menu>
    </Paper>
  );
}
