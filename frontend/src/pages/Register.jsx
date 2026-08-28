import React, { useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, AlertCircle, Camera, User, X, Check, Eye, EyeOff, Mail, Lock, Sparkles } from 'lucide-react';

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const eyeToggleStyle = {
  position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'var(--text-muted)', padding: '0.25rem',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: 'var(--radius-xs)', transition: 'color var(--transition)',
};

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fileInputRef = useRef(null);
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    setImageError(null);
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setImageError('Invalid image format. Allowed formats: JPG, PNG, WEBP.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setImageError(`Image must be 5MB or smaller (selected file is ${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
      return;
    }
    setProfileImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setImagePreview(null);
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      if (profileImage) {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('profile_image', profileImage);
        await register(formData);
      } else {
        await register({ name, email, password });
      }
      navigate(redirectPath);
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem 1.25rem', animation: 'wsPageIn 0.35s ease-out'
    }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 50, height: 50, borderRadius: 'var(--radius-md)',
            background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(11,94,215,0.3)', margin: '0 auto 0.85rem'
          }}>
            <Sparkles size={24} color="white" />
          </div>
          <h1 style={{
            fontSize: '1.95rem', color: 'var(--dark-navy)', marginBottom: '0.4rem',
            fontFamily: 'var(--font-heading)', fontWeight: 800, letterSpacing: '-0.025em'
          }}>
            Join WanderSync
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Create your profile and start designing AI journeys
          </p>
        </div>

        <div className="card" style={{
          padding: '2.5rem',
          boxShadow: '0 20px 40px -8px rgba(15,23,42,0.12), 0 6px 14px -4px rgba(15,23,42,0.06)',
          border: '1.5px solid var(--border-color)',
          borderRadius: 'var(--radius-xl)',
        }}>
          {/* Profile Image Upload */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            marginBottom: '1.75rem', padding: '1.5rem',
            background: 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)',
            borderRadius: 'var(--radius-lg)',
            border: `2px dashed ${imagePreview ? 'var(--primary-blue)' : 'var(--border-color)'}`,
            textAlign: 'center',
            transition: 'border-color var(--transition)',
          }}>
            {/* Avatar circle */}
            <div
              style={{
                position: 'relative', width: 86, height: 86, borderRadius: '50%',
                background: imagePreview ? 'transparent' : 'var(--gradient-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', overflow: 'hidden', marginBottom: '0.85rem',
                boxShadow: imagePreview ? '0 0 0 4px var(--primary-blue-muted)' : '0 4px 14px rgba(11,94,215,0.25)',
                border: imagePreview ? '3px solid var(--primary-blue)' : '3px solid transparent',
                transition: 'box-shadow var(--transition), border-color var(--transition)',
              }}
              onClick={() => fileInputRef.current?.click()}
              title="Click to choose a profile photo"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Avatar preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={42} color="#FFFFFF" opacity={0.9} />
              )}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(15,23,42,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0, transition: 'opacity 0.2s ease', color: 'white',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '0'; }}
              >
                <Camera size={22} />
              </div>
            </div>

            <input
              ref={fileInputRef} type="file" id="register-profile-image"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              style={{ display: 'none' }} onChange={handleImageChange}
            />

            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--dark-navy)', marginBottom: '0.2rem' }}>
              {imagePreview ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'center', color: 'var(--secondary-green)' }}>
                  <Check size={15} /> Photo Selected
                </span>
              ) : 'Upload profile photo'}
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>JPG, PNG, WEBP • Max 5MB (Optional)</div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => fileInputRef.current?.click()}>
                {imagePreview ? 'Change Photo' : 'Choose Image'}
              </button>
              {imagePreview && (
                <button type="button" className="btn btn-outline btn-sm" onClick={handleRemoveImage}
                  style={{ color: '#DC2626', borderColor: '#FECACA' }}>
                  <X size={13} /> Remove
                </button>
              )}
            </div>

            {imageError && (
              <div style={{ color: '#DC2626', fontSize: '0.8rem', marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertCircle size={14} /><span>{imageError}</span>
              </div>
            )}
          </div>

          {/* Error banner */}
          {error && (
            <div style={{
              background: '#FEF2F2', color: '#DC2626', padding: '0.85rem 1.1rem',
              borderRadius: 'var(--radius-md)', fontSize: '0.875rem', marginBottom: '1.5rem',
              display: 'flex', alignItems: 'center', gap: '0.6rem', border: '1px solid #FECACA',
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} /><span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="name" className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input type="text" id="name" className="form-input" placeholder="e.g. Anousha Zameer"
                  value={name} onChange={(e) => setName(e.target.value)} required style={{ paddingLeft: '2.75rem' }} />
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="reg-email" className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input type="email" id="reg-email" className="form-input" placeholder="anousha@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} required style={{ paddingLeft: '2.75rem' }} />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input type={showPassword ? 'text' : 'password'} id="password" className="form-input"
                  placeholder="At least 6 characters" value={password}
                  onChange={(e) => setPassword(e.target.value)} required style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide' : 'Show'} style={eyeToggleStyle}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="confirm_password" className="form-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input type={showConfirmPassword ? 'text' : 'password'} id="confirm_password" className="form-input"
                  placeholder="Re-enter password" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} required style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? 'Hide' : 'Show'} style={eyeToggleStyle}>
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {/* Password match indicator */}
              {confirmPassword.length > 0 && (
                <div style={{ fontSize: '0.8rem', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem',
                  color: password === confirmPassword ? 'var(--secondary-green)' : '#DC2626' }}>
                  {password === confirmPassword ? <><Check size={13} /> Passwords match</> : <><X size={13} /> Passwords don't match</>}
                </div>
              )}
            </div>

            {/* Terms checkbox */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '1.75rem' }}>
              <input type="checkbox" id="terms" required
                style={{ marginTop: '0.25rem', accentColor: 'var(--primary-blue)', cursor: 'pointer', width: 15, height: 15 }} />
              <label htmlFor="terms" style={{ fontSize: '0.83rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                I agree to the WanderSync <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
              </label>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary btn-full btn-lg"
              style={{ marginBottom: '1.35rem', opacity: loading ? 0.7 : 1 }}>
              {loading
                ? <><span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Creating Account...</>
                : <>Create Account <ArrowRight size={16} /></>}
            </button>

            <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Already have an account?{' '}
              <Link to={`/login?redirect=${encodeURIComponent(redirectPath)}`} style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>
                Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
