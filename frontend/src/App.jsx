import React, { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import Navbar from './Components/Navbar/Navbar';
import Home from './pages/Home/Home';
import Cart from './pages/Cart/Cart';
import Placeorder from './pages/PlaceOrder/Placeorder';
import MyOrders from './pages/MyOrders/MyOrders';
import AdminOrders from './pages/AdminOrders/AdminOrders';
import Footer from './Components/Footer/Footer';
import LoginPopup from './Components/LoginPopup/LoginPopup';
import StoreContextProvider from './Context/storecontext'; // 🔥

const App = () => {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <StoreContextProvider>
      {showLogin && <LoginPopup setShowLogin={setShowLogin} />}
      <div className="app">
        <Navbar setShowLogin={setShowLogin} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<Cart setShowLogin={setShowLogin} />} />
          <Route path="/order" element={<Placeorder />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/admin" element={<AdminOrders />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
        </Routes>
      </div>
      <Footer />
    </StoreContextProvider>
  );
};

export default App;
