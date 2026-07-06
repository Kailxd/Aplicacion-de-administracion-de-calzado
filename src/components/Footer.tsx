/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-stone-150 py-5 px-4 text-center mt-12" id="app-footer">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-stone-500 font-sans">
        <div id="footer-logo-tag">
          <span className="font-display font-semibold text-stone-700">Sistema de Distribución de Calzado</span>
          <span className="text-stone-300 mx-2">|</span>
          <span className="font-mono">v1.2.0</span>
        </div>
        <div className="font-mono text-stone-400" id="footer-credits">
          BigHunters © 2026
        </div>
      </div>
    </footer>
  );
}
