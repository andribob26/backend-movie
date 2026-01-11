// import { Request, Response, NextFunction } from 'express';

// export function CustomCorsMiddleware(
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) {
//   const origin = req.headers.origin;
//   const method = req.method;

//   // Full akses untuk dashboard dan localhost dev
//   const fullAccessOrigins = [
//     'https://dash.mydomain.com',
//     'http://localhost:8189',
//     'http://194.163.145.94:8189',
//     'http://194.163.145.94',
//     'http://localhost:5173',
//   ];

//   // Read-only untuk frontend publik
//   const readOnlyOrigins = [
//     'https://stream.nimeninja.win',
//     'https://player-hls-three.vercel.app',
//     'http://localhost:4000', // local frontend
//     'http://localhost:3000',
//   ];

//   const allowedOrigins = [...fullAccessOrigins, ...readOnlyOrigins];

//   // Handle jika origin tidak dikenal
//   if (origin && allowedOrigins.includes(origin)) {
//     res.setHeader('Access-Control-Allow-Origin', origin);
//     res.setHeader('Access-Control-Allow-Credentials', 'true');
//     res.setHeader(
//       'Access-Control-Allow-Headers',
//       'Content-Type, Authorization',
//     );

//     if (fullAccessOrigins.includes(origin)) {
//       res.setHeader(
//         'Access-Control-Allow-Methods',
//         'GET,HEAD,POST,PUT,DELETE,PATCH,OPTIONS',
//       );
//     } else if (readOnlyOrigins.includes(origin)) {
//       res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');

//       if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
//         return res.status(403).json({
//           message:
//             'Forbidden: This origin is only allowed to perform safe methods.',
//         });
//       }
//     }
//   } else {
//     // Jika origin tidak dikenal (misal direct curl), bisa ditolak atau diberi default CORS
//     res.setHeader('Access-Control-Allow-Origin', '*'); // Atau bisa dikosongkan
//     res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
//   }

//   if (method === 'OPTIONS') {
//     return res.status(204).end();
//   }

//   next();
// }

import { Request, Response, NextFunction } from 'express';

export function CustomCorsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // ✅ Izinkan semua origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,HEAD,POST,PUT,DELETE,PATCH,OPTIONS',
  );

  // OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
}
