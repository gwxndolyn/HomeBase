import LiquidEther from './LiquidEther'
import LiquidGlassNav from './LiquidGlassNav'
import TextType from './TextType'
import shareLahLogo from './sharelah.png'
import { ArrowRight, Shield, MapPin, Clock, Star, Users, CreditCard, MessageCircle, CheckCircle, Heart } from 'lucide-react';
import { FaReact } from 'react-icons/fa';
import { SiFirebase } from 'react-icons/si';
import { FaStripe } from 'react-icons/fa';
import { SiGooglemaps } from 'react-icons/si';
import { SiTypescript } from 'react-icons/si';
import { SiTailwindcss } from 'react-icons/si';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Shield,
      title: "Trust & Safety",
      description: "Secure deposits, verified profiles, and comprehensive insurance protection for every rental."
    },
    {
      icon: MapPin,
      title: "Location-Based Discovery",
      description: "Find items near you with our interactive map and smart proximity filters."
    },
    {
      icon: Clock,
      title: "Smart Scheduling",
      description: "Integrated calendar booking with automated reminders and flexible pickup times."
    },
    {
      icon: Star,
      title: "Community Ratings",
      description: "Build trust through transparent reviews and community-driven reputation scores."
    },
    {
      icon: CreditCard,
      title: "Secure Payments",
      description: "Automated deposit handling with instant refunds and transparent pricing."
    },
    {
      icon: MessageCircle,
      title: "AI Support",
      description: "24/7 chatbot assistance for bookings, disputes, and platform guidance."
    }
  ]

  const stats = [
    { number: "10,000+", label: "Active Users" },
    { number: "50,000+", label: "Items Listed" },
    { number: "98%", label: "Satisfaction Rate" },
    { number: "$2M+", label: "Community Savings" }
  ]

  const steps = [
    {
      step: "01",
      title: "Browse & Discover",
      description: "Search through thousands of items in your neighborhood using our smart filters and interactive map."
    },
    {
      step: "02",
      title: "Book & Secure",
      description: "Select your dates, pay securely with automatic deposit protection, and get instant confirmation."
    },
    {
      step: "03",
      title: "Use & Enjoy",
      description: "Pick up your item, complete your project, and return it in the same condition."
    },
    {
      step: "04",
      title: "Rate & Review",
      description: "Share your experience to help build a stronger, more trustworthy community."
    }
  ]

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Liquid Ether Background */}
      <div style={{ width: '100%', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: -1 }}>
        <LiquidEther
          colors={['#5227FF', '#FF9FFC', '#B19EEF']}
          mouseForce={20}
          cursorSize={100}
          isViscous={false}
          viscous={30}
          iterationsViscous={32}
          iterationsPoisson={32}
          resolution={0.5}
          isBounce={false}
          autoDemo={true}
          autoSpeed={0.5}
          autoIntensity={2.2}
          takeoverDuration={0.25}
          autoResumeDelay={3000}
          autoRampDuration={0.6}
        />
      </div>

      {/* Liquid Glass Navigation */}
      <LiquidGlassNav />

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4 pt-20">
        <div className="max-w-6xl mx-auto text-center">
          <div className="animate-fadeInUp">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-hero font-sf-pro-display text-white mb-6">
              <TextType
                text="Rent Lah. Save Lah."
                speed={300}
                delay={200}
                className="block"
              />
              <span className="block mt-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
                Share Lah.
              </span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-body-large font-sf-pro-text text-white/80 max-w-3xl mx-auto mb-8 md:mb-10 animate-fadeInUp delay-1000 px-4">
              Access thousands of tools, appliances, and equipment in Singapore without the cost of ownership.
              Connect with neighbors, save money, and reduce waste through our trusted sharing platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fadeInUp delay-1500">
              <button 
                onClick={() => navigate('/auth')}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-300 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl transition-apple shadow-2xl hover:shadow-blue-500/25 font-medium text-lg flex items-center justify-center group"
              >
                Start Browsing
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => navigate('/auth')}
                className="px-8 py-4 glass-effect text-white rounded-xl transition-apple hover:bg-white/20 font-medium text-lg"
              >
                List Your Items
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 md:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center animate-fadeInUp" style={{animationDelay: `${index * 200}ms`}}>
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold font-sf-pro-display text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-white/60 font-sf-pro-text font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-16 animate-fadeInUp">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-large font-sf-pro-display text-white mb-4 px-4">
              Everything You Need for Safe Sharing
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-body-large font-sf-pro-text text-white/70 max-w-2xl mx-auto px-4">
              Our platform combines cutting-edge technology with community trust to create the ultimate sharing experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="glass-effect p-8 rounded-2xl hover:bg-white/15 transition-apple group animate-fadeInUp" style={{animationDelay: `${index * 100}ms`}}>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-300 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold font-sf-pro-display text-white mb-3">{feature.title}</h3>
                <p className="text-white/70 font-sf-pro-text leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-16 animate-fadeInUp">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-large font-sf-pro-display text-white mb-4 px-4">
              How HomeBase Works
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-body-large font-sf-pro-text text-white/70 max-w-2xl mx-auto px-4">
              Get started in minutes and join thousands of Singaporeans already saving money through sharing.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center animate-fadeInUp" style={{animationDelay: `${index * 200}ms`}}>
                <div className="mb-6">
                  <span className="text-6xl font-bold font-sf-pro-display bg-gradient-to-r from-blue-500 to-purple-300 bg-clip-text text-transparent">
                    {step.step}
                  </span>
                </div>
                <h3 className="text-xl font-semibold font-sf-pro-display text-white mb-3">{step.title}</h3>
                <p className="text-white/70 font-sf-pro-text leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Trust Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fadeInUp">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-large font-sf-pro-display text-white mb-6">
                Built on Community Trust
              </h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-body-large font-sf-pro-text text-white/70 mb-8">
                Our comprehensive safety features and community guidelines ensure every rental is secure, reliable, and worry-free.
              </p>

              <div className="space-y-4">
                {[
                  "Verified user profiles and identity checks",
                  "Comprehensive damage protection and insurance",
                  "24/7 AI-powered customer support",
                  "Secure payments with instant deposit refunds",
                  "Community-driven ratings and reviews"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
                    <span className="text-white/80 font-sf-pro-text">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-effect p-8 rounded-2xl animate-fadeInUp delay-300">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-300 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold font-sf-pro-display text-white">Sarah L.</h3>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-white/70 font-sf-pro-text mb-4 leading-relaxed">
                "HomeBase has been incredible for our home renovation. I've rented everything from power tools to a pressure washer. The community is so helpful and trustworthy!"
              </p>
              <div className="flex items-center text-sm text-white/50 font-sf-pro-text">
                <MapPin className="h-4 w-4 mr-1" />
                Tanjong Pagar
                <Clock className="h-4 w-4 ml-4 mr-1" />
                2 days ago
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="animate-fadeInUp">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-large font-sf-pro-display text-white mb-4 px-4">
              Powered by Modern Technology
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-body-large font-sf-pro-text text-white/70 max-w-2xl mx-auto mb-8 md:mb-12 px-4">
              Built with cutting-edge web technologies for a fast, secure, and reliable experience.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {[
              { name: "React", color: "#61DAFB", icon: FaReact },
              { name: "Firebase", color: "#FFCA28", icon: SiFirebase },
              { name: "Tailwind", color: "#06B6D4", icon: SiTailwindcss },
              { name: "TypeScript", color: "#3178C6", icon: SiTypescript },
              { name: "Stripe", color: "#635BFF", icon: FaStripe },
              { name: "Maps API", color: "#4285F4", icon: SiGooglemaps }
            ].map((tech, index) => {
              const IconComponent = tech.icon;
              return (
                <div key={index} className="glass-effect p-6 rounded-xl hover:bg-white/15 transition-apple animate-fadeInUp" style={{animationDelay: `${index * 100}ms`}}>
                  <div className="flex flex-col items-center">
                    <IconComponent className="h-12 w-12 mb-3" style={{ color: tech.color }} />
                    <div className="text-white font-sf-pro-text font-medium">{tech.name}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-fadeInUp">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-large font-sf-pro-display text-white mb-6 px-4">
              Ready to Start Sharing?
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-body-large font-sf-pro-text text-white/70 mb-8 md:mb-10 px-4">
              Join thousands of Singaporeans who are already saving money and building community through smart sharing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/auth')}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-300 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl transition-apple shadow-2xl hover:shadow-blue-500/25 font-medium text-lg flex items-center justify-center group"
              >
                Create Your Account
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => navigate('/auth')}
                className="px-8 py-4 glass-effect text-white rounded-xl transition-apple hover:bg-white/20 font-medium text-lg"
              >
                Browse Available Items
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-effect border-t border-white/10 mt-20">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="animate-fadeInUp">
              <div className="flex items-center space-x-3 mb-4">
                <img src={shareLahLogo} alt="HomeBase Logo" className="w-8 h-8" />
                <span className="font-bold text-xl font-sf-pro-display text-white">HomeBase</span>
              </div>
              <p className="text-white/60 font-sf-pro-text">
                Building stronger communities through smart sharing in Singapore lah!
              </p>
            </div>

            {[
              {
                title: "Platform",
                links: ["How it Works", "Safety", "Insurance", "Pricing"]
              },
              {
                title: "Community",
                links: ["Guidelines", "Blog", "Events", "Support"]
              },
              {
                title: "Company",
                links: ["About Us", "Careers", "Privacy", "Terms"]
              }
            ].map((section, index) => (
              <div key={index} className="animate-fadeInUp" style={{animationDelay: `${(index + 1) * 100}ms`}}>
                <h3 className="font-semibold font-sf-pro-display text-white mb-4">{section.title}</h3>
                <ul className="space-y-2">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a href="#" className="text-white/60 hover:text-white transition-colors font-sf-pro-text">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-white/60 font-sf-pro-text">
            <p>&copy; 2025 HomeBase. All rights reserved.</p>
            <div className="flex items-center mt-4 md:mt-0">
              <Heart className="h-4 w-4 mr-2 text-red-400" />
              <span>Made with love in Singapore lah!</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}