import { Link } from 'react-router-dom';
import { ChefHat } from 'lucide-react';

const Footer = () => (
  <footer className="bg-surface-900 text-white">
    {/* Main footer */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="md:col-span-1">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 bg-brand-500 rounded-lg flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl">
              <span className="text-brand-400">recipe</span>nest
            </span>
          </Link>
          <p className="text-surface-400 text-sm leading-relaxed">
            RecipeNest is where food lovers, home cooks, and professional chefs come together to share and discover great food.
          </p>
        </div>

        {/* Explore */}
        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-surface-300">Explore</h3>
          <ul className="space-y-2.5 text-sm text-surface-400">
            <li><Link to="/recipes" className="hover:text-brand-400 transition-colors">All Recipes</Link></li>
            <li><Link to="/recipes?mealType=Dinner" className="hover:text-brand-400 transition-colors">Dinners</Link></li>
            <li><Link to="/recipes?mealType=Breakfast" className="hover:text-brand-400 transition-colors">Breakfast</Link></li>
            <li><Link to="/recipes?mealType=Dessert" className="hover:text-brand-400 transition-colors">Desserts</Link></li>
            <li><Link to="/recipes?mealType=Snack" className="hover:text-brand-400 transition-colors">Snacks</Link></li>
          </ul>
        </div>

        {/* Cuisines */}
        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-surface-300">Cuisines</h3>
          <ul className="space-y-2.5 text-sm text-surface-400">
            <li><Link to="/recipes?cuisine=Italian" className="hover:text-brand-400 transition-colors">Italian</Link></li>
            <li><Link to="/recipes?cuisine=Indian" className="hover:text-brand-400 transition-colors">Indian</Link></li>
            <li><Link to="/recipes?cuisine=Chinese" className="hover:text-brand-400 transition-colors">Chinese</Link></li>
            <li><Link to="/recipes?cuisine=Mexican" className="hover:text-brand-400 transition-colors">Mexican</Link></li>
            <li><Link to="/recipes?cuisine=Thai" className="hover:text-brand-400 transition-colors">Thai</Link></li>
          </ul>
        </div>

        {/* Community */}
        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-surface-300">Community</h3>
          <ul className="space-y-2.5 text-sm text-surface-400">
            <li><Link to="/chefs" className="hover:text-brand-400 transition-colors">Browse Chefs</Link></li>
            <li><Link to="/auth/register" className="hover:text-brand-400 transition-colors">Join as Chef</Link></li>
            <li><Link to="/search" className="hover:text-brand-400 transition-colors">Search</Link></li>
          </ul>
        </div>
      </div>
    </div>

    {/* Bottom bar */}
    <div className="border-t border-surface-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-surface-500">© {new Date().getFullYear()} RecipeNest. All rights reserved.</p>
        <div className="flex items-center gap-6 text-xs text-surface-500">
          <span className="hover:text-surface-300 cursor-pointer transition-colors">Terms of Service</span>
          <span className="hover:text-surface-300 cursor-pointer transition-colors">Privacy Policy</span>
          <span className="hover:text-surface-300 cursor-pointer transition-colors">Cookie Policy</span>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
