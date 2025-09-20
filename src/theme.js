// src/theme.js
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#f5b301", // La couleur orange/jaune de votre logo
    },
    background: {
      default: "#ffffff", // Fond blanc par défaut
      paper: "#f9f9f9", // Couleur de fond pour les éléments comme la sidebar
    },
  },
  typography: {
    fontFamily: "Roboto, sans-serif",
  },
});

export default theme;
