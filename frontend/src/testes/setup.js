// Acrescenta ao expect() verificações do DOM, como toBeInTheDocument()
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Depois de cada teste, demsmonta o que foi desenhado e limpa o localStorage
afterEach(() => {
    cleanup();
    localStorage.clear();
});
