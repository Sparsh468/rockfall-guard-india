import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Dashboard from "@/components/Dashboard";
import UploadInterface from "@/components/UploadInterface";
import PredictionInterface from "@/components/PredictionInterface";
import AlertInterface from "@/components/AlertInterface";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Enhanced live rockfall background animation
  useEffect(() => {
    const canvas = document.getElementById('rockfall-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number, 
      y: number, 
      size: number, 
      speed: number, 
      opacity: number,
      color: string,
      rotation: number,
      rotationSpeed: number
    }> = [];

    const sparkles: Array<{
      x: number,
      y: number,
      life: number,
      maxLife: number,
      size: number
    }> = [];

    // Create more dynamic particles
    for (let i = 0; i < 35; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 4 + 1,
        speed: Math.random() * 3 + 0.8,
        opacity: Math.random() * 0.4 + 0.1,
        color: Math.random() > 0.7 ? 'hsl(45, 93%, 58%)' : 'hsl(25, 95%, 53%)',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1
      });
    }

    const createSparkle = (x: number, y: number) => {
      sparkles.push({
        x,
        y,
        life: 0,
        maxLife: 30,
        size: Math.random() * 2 + 1
      });
    };

    const animate = () => {
      // Create trailing effect
      ctx.fillStyle = 'rgba(34, 39, 46, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Animate particles
      particles.forEach((particle, index) => {
        particle.y += particle.speed;
        particle.x += Math.sin(particle.y * 0.008) * 1.2;
        particle.rotation += particle.rotationSpeed;
        
        if (particle.y > canvas.height + 20) {
          particle.y = -particle.size;
          particle.x = Math.random() * canvas.width;
          // Create sparkle when particle resets
          if (Math.random() > 0.8) {
            createSparkle(particle.x, canvas.height);
          }
        }
        
        ctx.save();
        ctx.globalAlpha = particle.opacity * Math.sin(Date.now() * 0.002 + index) * 0.5 + 0.5;
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        
        // Create glowing effect
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size * 2);
        gradient.addColorStop(0, particle.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(-particle.size, -particle.size, particle.size * 2, particle.size * 2);
        
        // Core particle
        ctx.fillStyle = particle.color;
        ctx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
        
        ctx.restore();
      });

      // Animate sparkles
      sparkles.forEach((sparkle, index) => {
        sparkle.life++;
        if (sparkle.life > sparkle.maxLife) {
          sparkles.splice(index, 1);
          return;
        }

        const alpha = 1 - (sparkle.life / sparkle.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = 'hsl(45, 93%, 58%)';
        ctx.beginPath();
        ctx.arc(sparkle.x, sparkle.y - sparkle.life * 2, sparkle.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      
      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (Math.random() > 0.9) {
        createSparkle(e.clientX, e.clientY);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveTab} />;
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
