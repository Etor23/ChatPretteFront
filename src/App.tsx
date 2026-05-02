import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './features/auth/pages/Login';
import Register from './features/auth/pages/Register';
import UserProfile from './features/users/pages/UserProfile';
import EditUserProfile from './features/users/pages/EditUserProfile';
import Conversations from './features/conversations/pages/Conversations';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/chats" element={<Conversations />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/edit-profile" element={<EditUserProfile />} />
      </Routes>
    </Router>
  );
}

export default App;
