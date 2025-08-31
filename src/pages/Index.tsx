import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Dashboard from "@/components/Dashboard";
import RiskMap from "@/components/RiskMap";
import UploadInterface from "@/components/UploadInterface";
import PredictionInterface from "@/components/PredictionInterface";
import AlertInterface from "@/components/AlertInterface";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Simulate live rockfall background animation
  useEffect(() => {
    const canvas = document.getElementById('rockfall-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{x: number, y: number, size: number, speed: number, opacity: number}> = [];

    // Create particles
    for (let i = 0; i < 20; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.3 + 0.1
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        particle.y += particle.speed;
        particle.x += Math.sin(particle.y * 0.01) * 0.5;
        
        if (particle.y > canvas.height) {
          particle.y = -particle.size;
          particle.x = Math.random() * canvas.width;
        }
        
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = 'hsl(25, 95%, 53%)';
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });
      
      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveTab} />;
      case 'map':
        return <RiskMap />;
      case 'upload':
        return <UploadInterface />;
      case 'prediction':
        return <PredictionInterface />;
      case 'alerts':
        return <AlertInterface />;
      default:
        return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-monitoring-bg text-foreground relative overflow-hidden">
      {/* Animated Background */}
      <canvas
        id="rockfall-canvas"
        className="fixed inset-0 z-0 pointer-events-none opacity-20"
      />
      
      {/* Background Gradient Overlay */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-monitoring-bg via-background to-monitoring-bg opacity-90" />
      
      {/* Main Content */}
      <div className="relative z-10">
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="container mx-auto px-6 py-8">
          {renderActiveComponent()}
        </main>
      </div>
    </div>
  );
};

export default Index;
