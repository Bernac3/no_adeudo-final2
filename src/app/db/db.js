const mysql = require('mysql2');

// Configuración de la conexión a la base de datos 'no_adeudo'
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', // Tu usuario de MySQL
  password: '1105', // Tu contraseña de MySQL
  database: 'no_adeudo', // Nombre de la base de datos
});

// Conexión
db.connect((err) => {
  if (err) {
    console.error('Error de conexión a la base de datos: ' + err.stack);
    return;
  }
  console.log('Conexión exitosa a la base de datos');
});

module.exports = db;

