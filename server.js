const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./src/app/db/db');
const multer = require('multer');
const app = express();
const path = require('path');
const uploads = multer();

app.use(cors());
app.use(bodyParser.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.post('/api/login', (req, res) => {
  const { correo, contrasena } = req.body;

  // Primero buscamos en la tabla de administradores
  let query = `
    SELECT
      idadministrador AS id,
      usuario,
      rol
    FROM administrador
    WHERE usuario = ? AND contrasena = ?
  `;

  db.query(query, [correo, contrasena], (err, results) => {
    if (err) {
      console.error('Error al verificar administrador:', err);
      return res.status(500).json({ error: 'Error en el servidor' });
    }

    if (results.length > 0) {
      // Si se encuentra en la tabla de administradores, enviamos los datos
      console.log('Administrador autenticado:', results[0]);
      return res.status(200).json(results[0]); // Enviar los datos del administrador
    }

    // Si no encontramos el administrador, buscamos en los alumnos
    query = `
      SELECT
        a.idalumnos AS id,
        a.nombre_completo,
        a.correo,
        a.telefono,
        a.no_control,
        a.foto,
        a.fecha_registro,
        a.rol,
        p.estatus_administracion_y_finanzas,
        p.estatus_centro_de_informacion,
        p.estatus_centro_de_computo,
        p.estatus_recursos_materiales,
        p.estatus_departamento_de_vinculacion,
        p.comentario_administracion_y_finanzas,
        p.comentario_centro_de_informacion,
        p.comentario_centro_de_computo,
        p.comentario_recursos_materiales,
        p.comentario_departamento_de_vinculacion,
        p.estatus_peticion
      FROM
        alumnos a
      LEFT JOIN
        peticiones p ON a.no_control = p.no_control
      WHERE
        a.correo = ? AND a.contrasena = ?
    `;

    db.query(query, [correo, contrasena], (err, results) => {
      if (err) {
        console.error('Error al verificar alumno:', err);
        return res.status(500).json({ error: 'Error en el servidor' });
      }

      if (results.length > 0) {
        // Si se encuentra en la tabla de alumnos, enviamos los datos
        console.log('Alumno autenticado:', results[0]);
        return res.status(200).json(results[0]); // Enviar los datos del alumno
      }

      // Si no encontramos el alumno, buscamos en los departamentos
      query = `
        SELECT
          d.iddepartamentos AS id,
          d.nombre_departamento,
          d.usuario,
          d.departamento_id,
          d.rol
        FROM
          departamentos d
        WHERE
          d.usuario = ? AND d.contrasena = ?
      `;

      db.query(query, [correo, contrasena], (err, results) => {
        if (err) {
          console.error('Error al verificar departamento:', err);
          return res.status(500).json({ error: 'Error en el servidor' });
        }

        if (results.length > 0) {
          // Si se encuentra en la tabla de departamentos, enviamos los datos
          console.log('Departamento autenticado:', results[0]);
          return res.status(200).json(results[0]); // Enviar los datos del departamento
        }

        // Si no encontramos el usuario en ninguna de las tablas
        console.log('Credenciales incorrectas');
        return res.status(401).json({ error: 'Credenciales incorrectas' });
      });
    });
  });
});



// Suponiendo que estás utilizando Express
app.get('/api/alumnos-peticiones', (req, res) => {
  const query = `
    SELECT alumnos.*, peticiones.*
    FROM alumnos
    LEFT JOIN peticiones ON alumnos.no_control = peticiones.no_control;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener los datos:', err);
      return res.status(500).json({ error: 'Error al obtener los datos' });
    }
    res.json(results); // Retorna los resultados como un arreglo de objetos
  });
});



const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// 📁 Configuración de multer para subir imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/'); // Carpeta donde se guardarán las imágenes
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Nombre único para evitar colisiones
  }
});

const upload = multer({ storage: storage });

// 🌐 Ruta para registrar alumnos
app.post('/api/register', upload.single('foto'), (req, res) => {
  const { nombre_completo, correo, telefono, no_control, contrasena } = req.body;
  const foto = req.file ? req.file.filename : null; // Nombre de la imagen subida

  // Verificar si el correo ya existe en la tabla alumnos
  const checkAlumnoQuery = 'SELECT * FROM alumnos WHERE correo = ? OR no_control = ?';
  db.query(checkAlumnoQuery, [correo, no_control], (err, result) => {
    if (err) {
      console.error('Error al verificar alumno:', err);
      return res.status(500).json({ error: 'Error en el servidor' });
    }

    // Si se encuentra un alumno con el mismo correo o número de control
    if (result.length > 0) {
      return res.status(400).json({ error: 'El correo o número de control ya están registrados como alumno' });
    }

    // Verificar si el correo ya existe en la tabla departamentos
    const checkDepartamentoQuery = 'SELECT * FROM departamentos WHERE usuario = ?';
    db.query(checkDepartamentoQuery, [correo], (err, result) => {
      if (err) {
        console.error('Error al verificar departamento:', err);
        return res.status(500).json({ error: 'Error en el servidor' });
      }

      // Si se encuentra un departamento con el mismo correo
      if (result.length > 0) {
        return res.status(400).json({ error: 'El correo ya está registrado como usuario de departamento' });
      }

      // Verificar si el correo ya existe en la tabla administrador
      const checkAdminQuery = 'SELECT * FROM administrador WHERE usuario = ?';
      db.query(checkAdminQuery, [correo], (err, result) => {
        if (err) {
          console.error('Error al verificar administrador:', err);
          return res.status(500).json({ error: 'Error en el servidor' });
        }

        // Si se encuentra un administrador con el mismo correo
        if (result.length > 0) {
          return res.status(400).json({ error: 'El correo ya está registrado como usuario administrador' });
        }

        // Si no existen coincidencias, insertar el nuevo alumno
        const query = `
          INSERT INTO alumnos (nombre_completo, correo, telefono, no_control, foto, contrasena, fecha_registro)
          VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;

        db.query(query, [nombre_completo, correo, telefono, no_control, foto, contrasena], (err, result) => {
          if (err) {
            console.error('Error al registrar alumno:', err);
            return res.status(500).json({ error: 'Error en el servidor' });
          }
          res.status(201).json({ message: 'Alumno registrado exitosamente' });
        });
      });
    });
  });
});





// Ruta para insertar la petición (actualizar el estatus de la petición)

app.post('/api/insertar-peticion', (req, res) => {
  const {
    alumnoNoControl,
    peticionEstatus,
    adeudoEstado,
    usuarioDepartamento,
    usuarioDepartamentoId,
    alumnoComentario // Se añade el comentario
  } = req.body;

  // Verificar si el alumno existe
  const queryAlumno = `SELECT * FROM alumnos WHERE no_control = ?`;
  db.query(queryAlumno, [alumnoNoControl], (err, alumnoResults) => {
    if (err) {
      console.error('Error al verificar el alumno:', err);
      return res.status(500).json({ error: 'Error al verificar el alumno' });
    }

    if (alumnoResults.length === 0) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }

    // Verificar si el usuario del departamento existe y tiene el rol adecuado
    const queryDepartamento = `SELECT * FROM departamentos WHERE usuario = ? AND departamento_id = ?`;
    db.query(queryDepartamento, [usuarioDepartamento, usuarioDepartamentoId], (err, departamentoResults) => {
      if (err) {
        console.error('Error al verificar el departamento:', err);
        return res.status(500).json({ error: 'Error al verificar el departamento' });
      }

      if (departamentoResults.length === 0) {
        return res.status(404).json({ error: 'Departamento no encontrado o no tiene los permisos adecuados' });
      }

      // Determinar la columna de comentario basada en el departamento
      let columnaComentario = '';
      switch (usuarioDepartamentoId) {
        case 'administracion_finanzas':
          columnaComentario = 'comentario_administracion_y_finanzas';
          break;
        case 'centro_informacion':
          columnaComentario = 'comentario_centro_de_informacion';
          break;
        case 'centro_computo':
          columnaComentario = 'comentario_centro_de_computo';
          break;
        case 'recursos_materiales':
          columnaComentario = 'comentario_recursos_materiales';
          break;
        case 'departamento_vinculacion':
          columnaComentario = 'comentario_departamento_de_vinculacion';
          break;
        default:
          return res.status(400).json({ error: 'Departamento no válido' });
      }

      // Si todo es correcto, proceder a actualizar la tabla peticiones
      const queryUpdatePeticion = `
        UPDATE peticiones
        SET ${peticionEstatus} = ?, ${columnaComentario} = ?, estatus_peticion = 'Actualizado'
        WHERE no_control = ?
      `;

      // Ejecutar la consulta para actualizar el estado y el comentario
      db.query(queryUpdatePeticion, [adeudoEstado, alumnoComentario, alumnoNoControl], (err, result) => {
        if (err) {
          console.error('Error al actualizar la petición:', err);
          return res.status(500).json({ error: 'Error al actualizar la petición' });
        }

        res.status(200).json({ message: 'Petición actualizada correctamente' });
      });
    });
  });
});



// Petición para actualizar datos de un alumno (solo administradores)
app.post('/api/actualizar-peticion-Adm', (req, res) => {
  // Recuperamos los datos del cuerpo de la solicitud
  const datosAlumnoModalAdmin = req.body;

  console.log('Datos del cuerpo de la solicitud:', datosAlumnoModalAdmin);

  let user;
  try {
    user = JSON.parse(req.headers.authorization); // El admin debe enviar su sesión en los headers
    console.log('Datos del usuario autenticado:', user);
  } catch (err) {
    console.error('Error al parsear el encabezado de autorización:', err);
    return res.status(400).json({ mensaje: 'El encabezado de autorización no es válido', error: err.message });
  }

  // Verificamos si el tipo de usuario es 'Admin'
  if (user.tipo_usuario !== 'admin') {
    console.log('Acceso denegado: El tipo de usuario no es Admin');
    return res.status(403).json({ mensaje: 'No autorizado, se requiere ser administrador' });
  }

  // Validamos si el admin existe en la base de datos
  const queryAdmin = 'SELECT * FROM administrador WHERE usuario = ? AND contrasena = ?';
  console.log('Ejecutando consulta para verificar al administrador:', queryAdmin, [user.correo, user.contrasena]);

  db.query(queryAdmin, [user.correo, user.contrasena], (err, result) => {
    if (err) {
      console.error('Error al verificar el administrador:', err);
      return res.status(500).json({ mensaje: 'Error al verificar el administrador', error: err });
    }

    if (result.length === 0) {
      console.log('Administrador no encontrado o contraseña incorrecta');
      return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
    }

    console.log('Administrador autenticado correctamente');

    // Actualizamos los datos en la tabla alumnos
    const updateAlumnoQuery = `
      UPDATE alumnos
      SET nombre_completo = ?, correo = ?, telefono = ?, contrasena = ?, fecha_registro = ?
      WHERE no_control = ?`;
    console.log('Ejecutando consulta para actualizar datos del alumno:', updateAlumnoQuery);

    db.query(updateAlumnoQuery, [
      datosAlumnoModalAdmin.alumnoNombre,
      datosAlumnoModalAdmin.alumnoCorreo,
      datosAlumnoModalAdmin.alumnoTelefono,
      datosAlumnoModalAdmin.alumnoContrasena,
      datosAlumnoModalAdmin.alumnoFechaRegistro,
      datosAlumnoModalAdmin.alumnoNoControl
    ], (err, resultAlumno) => {
      if (err) {
        console.error('Error al actualizar datos del alumno:', err);
        return res.status(500).json({ mensaje: 'Error al actualizar datos del alumno', error: err });
      }

      console.log('Datos del alumno actualizados correctamente:', resultAlumno);

      // Actualizamos los datos en la tabla peticiones
      const updatePeticionQuery = `
        UPDATE peticiones
        SET estatus_administracion_y_finanzas = ?, estatus_centro_de_informacion = ?,
            estatus_centro_de_computo = ?, estatus_recursos_materiales = ?,
            estatus_departamento_de_vinculacion = ?, comentario_administracion_y_finanzas = ?,
            comentario_centro_de_informacion = ?, comentario_centro_de_computo = ?,
            comentario_recursos_materiales = ?, comentario_departamento_de_vinculacion = ?,
            estatus_peticion = ?
        WHERE no_control = ?`;
      console.log('Ejecutando consulta para actualizar datos de la petición:', updatePeticionQuery);

      db.query(updatePeticionQuery, [
        datosAlumnoModalAdmin.alumnoEstatusAFModal,
        datosAlumnoModalAdmin.alumnoEstatusCIModal,
        datosAlumnoModalAdmin.alumnoEstatusCCModal,
        datosAlumnoModalAdmin.alumnoEstatusRMModal,
        datosAlumnoModalAdmin.alumnoEstatusDVModal,
        datosAlumnoModalAdmin.alumnoComentarioAdministracionFinanzasModal,
        datosAlumnoModalAdmin.alumnoComentarioCentroInformacionModal,
        datosAlumnoModalAdmin.alumnoComentarioCentroComputo,
        datosAlumnoModalAdmin.alumnoComentarioRecursosMateriales,
        datosAlumnoModalAdmin.alumnoComentarioDepartamentoVinculacion,
        'Pendiente',
        datosAlumnoModalAdmin.alumnoNoControl
      ], (err, resultPeticion) => {
        if (err) {
          console.error('Error al actualizar datos de la petición:', err);
          return res.status(500).json({ mensaje: 'Error al actualizar datos de la petición', error: err });
        }

        console.log('Datos de la petición actualizados correctamente:', resultPeticion);
        return res.status(200).json({ mensaje: 'Datos actualizados correctamente' });
      });
    });
  });
});






// Ruta para registrar departamentos
app.post('/api/register-departamento', uploads.none(), (req, res) => {
  const { nombre_completo, contrasena, tipo_usuario, fecha_registro } = req.body;
  const usuario = nombre_completo; // Renombrar nombre_completo a usuario
  const departamento_id = tipo_usuario; // Renombrar tipo_usuario a departamento_id

  console.log('Datos recibidos en el servidor:', {
    usuario,
    contrasena,
    departamento_id,
    fecha_registro, // Incluir en los logs para verificar el envío de la fecha
  });

  if (!usuario || !contrasena || !departamento_id || !fecha_registro) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  let nombre_departamento = '';
  switch (departamento_id) {
    case 'administracion_finanzas':
      nombre_departamento = 'Administración y Finanzas';
      break;
    case 'centro_informacion':
      nombre_departamento = 'Centro de Información';
      break;
    case 'centro_computo':
      nombre_departamento = 'Centro de Cómputo';
      break;
    case 'recursos_materiales':
      nombre_departamento = 'Recursos Materiales';
      break;
    case 'departamento_vinculacion':
      nombre_departamento = 'Departamento de Vinculación';
      break;
    default:
      return res.status(400).json({ error: 'El departamento_id proporcionado no es válido.' });
  }

  // Query para insertar en la tabla departamentos_no_autorizados
  const query = `
    INSERT INTO departamentos_no_autorizados
    (nombre_departamento, usuario, contrasena, departamento_id, fecha_registro)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(query, [nombre_departamento, usuario, contrasena, departamento_id, fecha_registro], (err, result) => {
    if (err) {
      console.error('Error al registrar departamento:', err);
      return res.status(500).json({ error: 'Error en el servidor' });
    }

    res.status(201).json({
      message:
        'Petición exitosa. Es necesario que el personal encargado del sitio autorice su cuenta para poder iniciar sesión.',
    });
  });
});


// Ruta para obtener los departamentos no autorizados
app.get('/api/departamentos-no-autorizados', (req, res) => {
  const query = `
    SELECT nombre_departamento, usuario, contrasena, departamento_id, fecha_registro
    FROM departamentos_no_autorizados
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener los departamentos no autorizados:', err);
      return res.status(500).json({ error: 'Error al obtener los datos de la base de datos' });
    }

    // Enviar los resultados al frontend
    res.status(200).json(results);
  });
});


// Insertar departamentos no autorizados y eliminar de la tabla de no autorizados
app.post('/api/insertar-departamentos-no-autorizados', async (req, res) => {
  const { correo, contrasena, tipo_usuario } = JSON.parse(req.headers.authorization);

  console.log('Auth Headers desde server.js:', { correo, contrasena, tipo_usuario }); // Verifica los datos recibidos

  if (tipo_usuario !== 'admin') {
    return res.status(401).json({ error: 'No autorizado: Solo los administradores pueden realizar esta acción' });
  }

  const queryAdmin = `
    SELECT * FROM administrador
    WHERE usuario = ? AND contrasena = ? AND rol = 'admin'
  `;

  db.query(queryAdmin, [correo, contrasena], (err, adminResults) => {
    if (err) {
      console.error('Error al verificar administrador:', err);
      return res.status(500).json({ error: 'Error al verificar administrador' });
    }

    console.log('Resultados del query de administrador:', adminResults); // Verifica los resultados del query

    if (adminResults.length === 0) {
      return res.status(401).json({ error: 'Administrador no autorizado' });
    }

    // Inserción del departamento
    const queryInsertDepartamento = `
      INSERT INTO departamentos (nombre_departamento, usuario, contrasena, departamento_id, rol)
      VALUES (?, ?, ?, ?, 'departamento')
    `;

    const { usuario: depUsuario, contrasena: depContrasena, departamento, departamentoId } = req.body;

    db.query(
      queryInsertDepartamento,
      [departamento, depUsuario, depContrasena, departamentoId],
      (err, insertResults) => {
        if (err) {
          console.error('Error al insertar departamento:', err);
          return res.status(500).json({ error: 'Error al insertar departamento' });
        }

        console.log('Departamento autorizado con éxito:', insertResults);

        // Eliminar el registro de la tabla departamentos_no_autorizados
        const queryDeleteDepartamentoNoAutorizado = `
          DELETE FROM departamentos_no_autorizados
          WHERE nombre_departamento = ? AND usuario = ? AND contrasena = ? AND departamento_id = ?
        `;

        db.query(
          queryDeleteDepartamentoNoAutorizado,
          [departamento, depUsuario, depContrasena, departamentoId],
          (err, deleteResults) => {
            if (err) {
              console.error('Error al eliminar departamento de no autorizados:', err);
              return res.status(500).json({ error: 'Error al eliminar departamento de no autorizados' });
            }

            console.log('Registro eliminado de departamentos_no_autorizados:', deleteResults);
            res.status(201).json({ message: 'Departamento autorizado con éxito y eliminado de no autorizados' });
          }
        );
      }
    );
  });
});


// Ruta para crear un nuevo departamento
app.post('/api/crear-departamento-admin', (req, res) => {
  console.log('Datos recibidos en el cuerpo de la solicitud (req.body):', req.body); // Verifica qué llega al backend

  // Desestructuramos los valores del cuerpo de la solicitud
  const { nombre_departamento, usuario, contrasena, departamento_id } = req.body;

  // Verificar que no haya valores nulos
  if (!nombre_departamento || !usuario || !contrasena || !departamento_id) {
    return res.status(400).json({ error: 'Faltan datos necesarios para el departamento.' });
  }

  // Verifica los datos del administrador a través de los headers
  const authData = req.headers.authorization ? JSON.parse(req.headers.authorization) : {};
  const { correo, contrasena: contrasenaAdmin } = authData;

  if (!correo || !contrasenaAdmin) {
    return res.status(400).json({ error: 'Faltan los datos del administrador para la autorización.' });
  }

  const queryAdmin = `SELECT * FROM administrador WHERE usuario = ? AND contrasena = ? LIMIT 1`;
  db.query(queryAdmin, [correo, contrasenaAdmin], (err, results) => {
    if (err) {
      console.error('Error al verificar los datos del administrador:', err);
      return res.status(500).json({ error: 'Error en el servidor al verificar el administrador.' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Los datos del administrador no son válidos o no existen.' });
    }

    // El administrador existe, proceder a insertar el nuevo departamento
    const queryInsertDepartamento = `
      INSERT INTO departamentos (nombre_departamento, usuario, contrasena, departamento_id, rol)
      VALUES (?, ?, ?, ?, 'departamento')
    `;

    // Verifica que los valores de los campos sean correctos
    console.log('Datos que se insertarán en la base de datos:', { nombre_departamento, usuario, contrasena, departamento_id });

    db.query(queryInsertDepartamento, [nombre_departamento, usuario, contrasena, departamento_id], (err, result) => {
      if (err) {
        console.error('Error al insertar el nuevo departamento:', err);
        return res.status(500).json({ error: 'Error en el servidor al insertar el departamento.' });
      }

      console.log('Departamento creado exitosamente:', result);
      res.status(201).json({
        message: 'Departamento creado exitosamente.',
        departamentoId: result.insertId
      });
    });
  });
});









app.post('/api/obtener-departamento', (req, res) => {
  const authData = req.headers.authorization ? JSON.parse(req.headers.authorization) : {};

  const { usuario, contrasena } = authData;

  // Validar credenciales del administrador
  const queryAdmin = `
    SELECT *
    FROM administrador
    WHERE usuario = ? AND contrasena = ?`;

  db.query(queryAdmin, [usuario, contrasena], (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Error al verificar las credenciales del administrador' });
    }
    if (results.length === 0) {
      return res.status(403).json({ error: 'Credenciales inválidas' });
    }

    // Si las credenciales son válidas, obtener los datos de los departamentos
    const queryDepartamentos = `
      SELECT
        iddepartamentos,
        nombre_departamento,
        usuario,
        contrasena,
        departamento_id,
        fecha_registro
      FROM departamentos`;

    db.query(queryDepartamentos, (error, departamentos) => {
      if (error) {
        return res.status(500).json({ error: 'Error al obtener los departamentos' });
      }
      return res.status(200).json({ departamentos });
    });
  });
});


app.post('/api/verificar-administrador', (req, res) => {
  const authData = req.headers.authorization ? JSON.parse(req.headers.authorization) : {};

  const { correo, contrasena } = authData;

  // Verificar si el administrador existe en la tabla administrador
  const queryAdmin = `
    SELECT * FROM administrador WHERE usuario = ? AND contrasena = ?`;

  db.query(queryAdmin, [correo, contrasena], (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Error al verificar las credenciales del administrador' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Administrador no encontrado' });
    }

    // Si existe, responde con éxito
    res.status(200).json({ success: true });
  });
});




// guardar departamento desde admin

app.post('/api/guardar-departamento-adm', (req, res) => {
  const departamento = req.body;
  const authData = req.headers.authorization ? JSON.parse(req.headers.authorization) : {};

  const { usuario, contrasena, iddepartamentos } = departamento; // Incluir iddepartamentos
  const { correo, contrasena: adminContrasena } = authData;  // Obtener correo y contrasena del administrador

  console.log('Datos recibidos del cuerpo de la solicitud:', departamento);
  console.log('Datos de autenticación del administrador:', authData);

  // Verificar si el administrador existe en la base de datos
  const queryAdmin = `
    SELECT * FROM administrador WHERE usuario = ? AND contrasena = ?`;

  console.log('Consulta para verificar administrador:', queryAdmin);
  console.log('Parámetros de consulta del administrador:', [correo, adminContrasena]);

  db.query(queryAdmin, [correo, adminContrasena], (error, results) => {
    if (error) {
      console.error('Error al verificar el administrador:', error); // Log de error en consola
      return res.status(500).json({ error: 'Error al verificar las credenciales del administrador' });
    }

    if (results.length === 0) {
      console.log('Administrador no encontrado.');
      return res.status(404).json({ error: 'Administrador no encontrado' });
    }

    console.log('Administrador encontrado:', results);

    // Si el administrador existe, realizar el UPDATE en la tabla departamentos
    const queryUpdate = `
      UPDATE departamentos
      SET usuario = ?, contrasena = ?
      WHERE iddepartamentos = ?`;

    console.log('Consulta para actualizar departamento:', queryUpdate);
    console.log('Parámetros de consulta para actualización:', [usuario, contrasena, iddepartamentos]);

    db.query(queryUpdate, [usuario, contrasena, iddepartamentos], (updateError, updateResults) => {
      if (updateError) {
        console.error('Error al actualizar el departamento:', updateError); // Log de error en consola
        return res.status(500).json({ error: 'Error al actualizar el departamento' });
      }

      console.log('Resultado de la actualización del departamento:', updateResults);

      if (updateResults.affectedRows === 0) {
        console.log('No se actualizó ningún registro. Puede que el iddepartamentos no exista o los datos no coincidan.');
        return res.status(404).json({ error: 'No se encontró el departamento o los datos no coinciden' });
      }

      res.status(200).json({ success: true, message: 'Departamento actualizado correctamente' });
    });
  });
});


// eliminar departamento admin by id
app.post('/api/eliminar-departamento-adm', (req, res) => {
  const departamentoId = req.body.departamentoId; // Acceder al valor directamente
  const authData = req.headers.authorization ? JSON.parse(req.headers.authorization) : {}; // Recuperamos los datos de autenticación desde los headers

  const { correo, contrasena: adminContrasena } = authData;  // Obtener correo y contrasena del administrador

  console.log('Datos recibidos para eliminar departamento:', departamentoId);
  console.log('Datos de autenticación del administrador:', authData);

  // Verificar si el administrador existe en la base de datos
  const queryAdmin = `
    SELECT * FROM administrador WHERE usuario = ? AND contrasena = ?`;

  console.log('Consulta para verificar administrador:', queryAdmin);
  console.log('Parámetros de consulta del administrador:', [correo, adminContrasena]);

  db.query(queryAdmin, [correo, adminContrasena], (error, results) => {
    if (error) {
      console.error('Error al verificar el administrador:', error); // Log de error en consola
      return res.status(500).json({ error: 'Error al verificar las credenciales del administrador' });
    }

    if (results.length === 0) {
      console.log('Administrador no encontrado.');
      return res.status(404).json({ error: 'Administrador no encontrado' });
    }

    console.log('Administrador encontrado:', results);

    // Si el administrador es válido, proceder con la eliminación del departamento
    const queryDelete = `
      DELETE FROM departamentos
      WHERE iddepartamentos = ?`;

    console.log('Consulta para eliminar departamento:', queryDelete);
    console.log('Parámetros de consulta para eliminación:', [departamentoId]);

    db.query(queryDelete, [departamentoId], (deleteError, deleteResults) => {
      if (deleteError) {
        console.error('Error al eliminar el departamento:', deleteError); // Log de error en consola
        return res.status(500).json({ error: 'Error al eliminar el departamento' });
      }

      console.log('Resultado de la eliminación del departamento:', deleteResults);

      if (deleteResults.affectedRows === 0) {
        console.log('No se encontró el departamento con el id proporcionado.');
        return res.status(404).json({ error: 'No se encontró el departamento' });
      }

      res.status(200).json({ success: true, message: 'Departamento eliminado correctamente' });
    });
  });
});



// eliminar alumno admin by id
app.post('/api/eliminar-alumno-adm', (req, res) => {
  const alumnoId = req.body.alumnoId; // ID del alumno (no_control)
  const authData = req.headers.authorization ? JSON.parse(req.headers.authorization) : null;

  if (!authData || !authData.correo || !authData.contrasena) {
    return res.status(400).json({ error: 'Faltan datos de autenticación' });
  }

  if (!alumnoId) {
    return res.status(400).json({ error: 'Falta el ID del alumno' });
  }

  // Verificar credenciales del administrador
  const queryAdmin = `
    SELECT * FROM administrador WHERE usuario = ? AND contrasena = ?`;

  db.query(queryAdmin, [authData.correo, authData.contrasena], (error, results) => {
    if (error) {
      console.error('Error al verificar el administrador:', error);
      return res.status(500).json({ error: 'Error al verificar las credenciales del administrador' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Administrador no encontrado' });
    }

    // Eliminar registros relacionados en la tabla `peticiones`
    const queryDeletePeticiones = `
      DELETE FROM peticiones WHERE no_control = ?`;

    db.query(queryDeletePeticiones, [alumnoId], (deleteError) => {
      if (deleteError) {
        console.error('Error al eliminar registros relacionados en peticiones:', deleteError);
        return res.status(500).json({ error: 'Error al eliminar registros relacionados en peticiones' });
      }

      // Eliminar el alumno
      const queryDeleteAlumno = `
        DELETE FROM alumnos WHERE no_control = ?`;

      db.query(queryDeleteAlumno, [alumnoId], (deleteAlumnoError, deleteAlumnoResults) => {
        if (deleteAlumnoError) {
          console.error('Error al eliminar el alumno:', deleteAlumnoError);
          return res.status(500).json({ error: 'Error al eliminar el alumno' });
        }

        if (deleteAlumnoResults.affectedRows === 0) {
          return res.status(404).json({ error: 'Alumno no encontrado' });
        }

        res.status(200).json({ success: true, message: 'Alumno eliminado correctamente' });
      });
    });
  });
});


// crear administrador desde admin
app.post('/api/insertar-admin', (req, res) => {
  const { usuario, contrasena } = req.body;
  const authData = req.headers.authorization
    ? JSON.parse(req.headers.authorization)
    : null;

  if (!authData || !authData.usuario || !authData.contrasena) {
    return res
      .status(400)
      .json({ error: 'Faltan datos de autenticación del administrador actual.' });
  }

  // Verificar credenciales del administrador actual
  const queryAuth = `SELECT * FROM administrador WHERE usuario = ? AND contrasena = ?`;
  db.query(queryAuth, [authData.usuario, authData.contrasena], (error, results) => {
    if (error) {
      console.error('Error al verificar credenciales del administrador:', error);
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Credenciales del administrador no válidas.' });
    }

    // Insertar nuevo administrador
    const queryInsert = `INSERT INTO administrador (usuario, contrasena, rol) VALUES (?, ?, 'admin')`;
    db.query(queryInsert, [usuario, contrasena], (insertError, insertResults) => {
      if (insertError) {
        console.error('Error al insertar el administrador:', insertError);
        return res.status(500).json({ error: 'Error al insertar el administrador.' });
      }

      res.status(201).json({ success: true, message: 'Administrador creado exitosamente.' });
    });
  });
});


// Obtener departamentos no autorizados
app.get('/api/departamentos-no-autorizados', (req, res) => {
  const query = `
    SELECT nombre_departamento, usuario, contrasena, departamento_id, fecha_registro
    FROM departamentos_no_autorizados
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener los departamentos no autorizados:', err);
      return res.status(500).json({ error: 'Error al obtener los datos de la base de datos' });
    }

    // Si no hay resultados, enviar un mensaje claro
    if (results.length === 0) {
      return res.status(404).json({ message: 'No se encontraron departamentos no autorizados' });
    }

    // Respuesta exitosa con los datos
    return res.status(200).json({ departamentosNoAutorizados: results });
  });
});

