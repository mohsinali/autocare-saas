import { FlatCompat } from '@eslint/eslintrc';
import { fileURLToPath } from 'url'; import path from 'path';
const baseDirectory = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory });
const config = [...compat.extends('next/core-web-vitals', 'next/typescript'), { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'] }];
export default config;
