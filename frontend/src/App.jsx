import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollManager from './components/ScrollManager';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Planner from './pages/Planner';
import Generating from './pages/Generating';
import ItineraryOverview from './pages/ItineraryOverview';
import DayDetails from './pages/DayDetails';
import TripMap from './pages/TripMap';
import TripAssistant from './pages/TripAssistant';
import TripBudget from './pages/TripBudget';
import TripWeather from './pages/TripWeather';
import Explore from './pages/Explore';
import SavedTrips from './pages/SavedTrips';
import Profile from './pages/Profile';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Global Route Scroll Reset Manager */}
        <ScrollManager />

        <Navbar />
        <main className="main-content">
          <Routes>
            {/* Public Guest-First Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/planner" element={<Planner />} />
            <Route path="/planner/generating" element={<Generating />} />
            
            {/* Trips & Itinerary Routes */}
            <Route path="/trips" element={<Navigate to="/saved-trips" replace />} />
            <Route path="/trips/" element={<Navigate to="/saved-trips" replace />} />
            <Route path="/my-trips" element={<Navigate to="/saved-trips" replace />} />
            <Route path="/trips/:tripId" element={<ItineraryOverview />} />
            <Route path="/trips/:tripId/day/:dayId" element={<DayDetails />} />
            <Route path="/trips/:tripId/map" element={<TripMap />} />
            <Route path="/trips/:tripId/assistant" element={<TripAssistant />} />
            <Route path="/trips/:tripId/budget" element={<TripBudget />} />
            <Route path="/trips/:tripId/weather" element={<TripWeather />} />

            {/* Protected Personal Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute featureName="your dashboard">
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/saved-trips"
              element={
                <ProtectedRoute featureName="your saved journeys">
                  <SavedTrips />
                </ProtectedRoute>
              }
            />
            <Route
              path="/saved-plans"
              element={
                <ProtectedRoute featureName="your saved plans">
                  <SavedTrips />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute featureName="your travel history">
                  <SavedTrips />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute featureName="your profile & settings">
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute featureName="your account settings">
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* 404 Fallback */}
            <Route path="*" element={
              <div className="container" style={{ textAlign: 'center', padding: '5rem 0' }}>
                <h2 style={{ fontSize: '2rem', color: 'var(--dark-navy)', marginBottom: '0.75rem' }}>404 — Page Not Found</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>The page you are looking for doesn't exist.</p>
                <a href="/" className="btn btn-primary">Return to Home</a>
              </div>
            } />
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  );
}
