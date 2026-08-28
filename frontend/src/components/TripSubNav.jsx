import React from 'react';
import { NavLink } from 'react-router-dom';
import { FileText, Calendar, MapPin, MessageSquare, CreditCard, CloudSun } from 'lucide-react';

export default function TripSubNav({ tripId = 'tokyo-cultural-2026' }) {
  return (
    <div className="trip-nav-bar">
      <div className="container">
        <div className="trip-nav-links">
          <NavLink 
            to={`/trips/${tripId}`} 
            end
            className={({ isActive }) => `trip-nav-link ${isActive ? 'active' : ''}`}
          >
            <FileText size={16} /> Overview
          </NavLink>
          <NavLink 
            to={`/trips/${tripId}/day/1`} 
            className={({ isActive }) => `trip-nav-link ${isActive ? 'active' : ''}`}
          >
            <Calendar size={16} /> Day-by-Day Details
          </NavLink>
          <NavLink 
            to={`/trips/${tripId}/map`} 
            className={({ isActive }) => `trip-nav-link ${isActive ? 'active' : ''}`}
          >
            <MapPin size={16} /> Interactive Map
          </NavLink>
          <NavLink 
            to={`/trips/${tripId}/assistant`} 
            className={({ isActive }) => `trip-nav-link ${isActive ? 'active' : ''}`}
          >
            <MessageSquare size={16} /> AI Assistant
          </NavLink>
          <NavLink 
            to={`/trips/${tripId}/budget`} 
            className={({ isActive }) => `trip-nav-link ${isActive ? 'active' : ''}`}
          >
            <CreditCard size={16} /> Budget Planner
          </NavLink>
          <NavLink 
            to={`/trips/${tripId}/weather`} 
            className={({ isActive }) => `trip-nav-link ${isActive ? 'active' : ''}`}
          >
            <CloudSun size={16} /> Weather & Alerts
          </NavLink>
        </div>
      </div>
    </div>
  );
}
