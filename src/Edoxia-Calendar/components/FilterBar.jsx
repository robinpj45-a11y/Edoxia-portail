import React from 'react';
import { motion } from 'framer-motion';
import { ROLES } from '../constants';

const FilterBar = ({ selectedRoles, onToggleRole }) => {
    return (
        <div className="flex flex-wrap gap-2 p-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 mb-6">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center mr-2">
                Filtrer par :
            </span>
            {ROLES.map((role) => {
                const isSelected = selectedRoles.includes(role.id);
                return (
                    <motion.button
                        key={role.id}
                        onClick={() => onToggleRole(role.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`
              px-3 py-1.5 rounded-full text-xs font-bold transition-all border
              ${isSelected ?
                                `${role.color} text-white border-transparent shadow-md` :
                                'bg-transparent text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }
            `}
                    >
                        {role.label}
                    </motion.button>
                );
            })}
        </div>
    );
};

export default FilterBar;
