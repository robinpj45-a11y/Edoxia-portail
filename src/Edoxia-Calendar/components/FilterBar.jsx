import React from 'react';
import { motion } from 'framer-motion';
import { ROLES } from '../constants';

const FilterBar = ({ selectedRoles, onToggleRole }) => {
    return (
        <div className="flex flex-wrap gap-2 p-4 bg-white/60 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 mb-6">
            <span className="text-sm font-bold text-brand-text/60 flex items-center mr-2 uppercase tracking-wide">
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
                                `${role.color} text-white border-transparent shadow-soft` :
                                'bg-white/50 text-brand-text/50 border-white hover:bg-white hover:text-brand-text shadow-inner hover:shadow-sm'
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
