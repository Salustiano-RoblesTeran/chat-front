import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import 'bootstrap/dist/css/bootstrap.min.css';

let socket;

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [nombreIngresado, setNombreIngresado] = useState(false); // Para verificar si el nombre se ingresó
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [mensajes, setMensajes] = useState([]);
  const [escribiendo, setEscribiendo] = useState(false);
  const [escribiendoMensaje, setEscribiendoMensaje] = useState('');

  useEffect(() => {
    if (nombreIngresado) {
      socket = io('https://chat-back-fawn.vercel.app/');

      socket.on('connect', () => setIsConnected(true));
      socket.on('disconnect', () => setIsConnected(false));

      // Emitir el evento cuando un nuevo usuario se conecta
      socket.emit('usuario_conectado', nombreUsuario);

      socket.on('chat_message', (data) => {
        setMensajes((mensajes) => [...mensajes, data]);
      });

      socket.on('typing', (usuario) => {
        setEscribiendo(true);
        setEscribiendoMensaje(`${usuario} está escribiendo...`);
      });

      socket.on('stop_typing', () => {
        setEscribiendo(false);
      });

      return () => {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('chat_message');
        socket.off('typing');
        socket.off('stop_typing');
      };
    }
  }, [nombreIngresado]); // Solo ejecutar este efecto si el nombre fue ingresado

  const enviarMensaje = () => {
    if (nuevoMensaje.trim()) {
      socket.emit('chat_message', {
        usuario: nombreUsuario, // Usamos el nombre ingresado como el nombre del usuario
        mensaje: nuevoMensaje
      });
      setNuevoMensaje(''); // Limpiar el campo de texto después de enviar
      socket.emit('stop_typing'); // Detener evento de escribiendo al enviar
    }
  };

  const handleInputChange = (e) => {
    setNuevoMensaje(e.target.value);
    socket.emit('typing', nombreUsuario); // Emitir el nombre del usuario al escribir
    if (!e.target.value) {
      socket.emit('stop_typing'); // Detener el evento cuando el input esté vacío
    }
  };

  const handleNombreSubmit = (e) => {
    e.preventDefault();
    if (nombreUsuario.trim()) {
      setNombreIngresado(true);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Evitar que el formulario se recargue al presionar Enter
      enviarMensaje(); // Enviar mensaje al presionar "Enter"
    }
  };

  return (
    <div className="container mt-4">
      {!nombreIngresado ? (
        // Formulario para pedir el nombre de usuario
        <div className="card">
          <div className="card-body">
            <h2>Bienvenido al Chat</h2>
            <form onSubmit={handleNombreSubmit}>
              <div className="mb-3">
                <label htmlFor="nombre" className="form-label">Ingresa tu nombre:</label>
                <input
                  type="text"
                  id="nombre"
                  className="form-control"
                  value={nombreUsuario}
                  onChange={(e) => setNombreUsuario(e.target.value)}
                  placeholder="Tu nombre"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary">Ingresar</button>
            </form>
          </div>
        </div>
      ) : (
        // Interfaz del chat una vez que el usuario ha ingresado su nombre
        <div className="card">
          <div className="card-body">
            <h2>{isConnected ? 'CONECTADO' : 'NO CONECTADO'}</h2>

            <ul className="list-group mb-3">
              {mensajes.map((mensaje, index) => (
                <li className="list-group-item" key={index}>
                  <strong>{mensaje.usuario}:</strong> {mensaje.mensaje}
                </li>
              ))}
            </ul>
            {escribiendo && <p className="text-muted">{escribiendoMensaje}</p>}

            <div className="input-group">
              <input
                type="text"
                className="form-control"
                value={nuevoMensaje}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown} // Agregar manejo de "Enter" con onKeyDown
                placeholder="Escribe tu mensaje..."
              />
              <button className="btn btn-primary" onClick={enviarMensaje}>
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
