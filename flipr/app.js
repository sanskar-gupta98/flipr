// app.js
/*document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    try {
      const response = await axios.post('http://localhost:3000/login', { username, password });
      localStorage.setItem('token', response.data.token);
      setMessage('Login successful');
      window.location.href = '/admin/dashboard'; // Redirect to admin dashboard after successful login
    } catch (error) {
      setMessage('Login failed');
    }
  });*/
  
  function setMessage(message) {
    document.getElementById('message').innerText = message;
  }
  