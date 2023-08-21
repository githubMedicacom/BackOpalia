const sql = require("mssql");
const config = {
  server: "azure-serverjc.database.windows.net",
  database: "clustering_Project",
  user: "CloudSA697f32f6",
  password: "Medicacom1234medicacom",
  encrypt: true,
};

// Function to connect to the database
async function connect() {
  try {
    await sql.connect(config);
    console.log("Connected to the database!");
  } catch (err) {
    console.error("Failed to connect to the database:", err);
  }
}

// Export the connect function
module.exports = { connect };
