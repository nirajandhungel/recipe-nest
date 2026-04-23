import pizzaImg from '../../assets/pizza-no-bg.png';

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen flex">
      
      {/* Left panel (shared) */}
      <div className="hidden lg:flex lg:w-1/2 
        bg-gradient-to-br from-surface-800 to-surface-950 
        text-white flex-col items-center justify-center p-12">

        <img
          src={pizzaImg}
          alt="Pizza"
        //   className="w-48 h-48 mb-6 object-contain"
        />

        <h1 className="font-display text-4xl font-bold mb-4 text-center">
          {title}
          <span className="p text-green-500">recipenest</span>
        </h1>

        <p className="text-surface-400 text-lg text-center max-w-xs">
          {subtitle}
        </p>

      </div>

      {/* Right panel (changes per page) */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        {children}
      </div>

    </div>
  );
};

export default AuthLayout;