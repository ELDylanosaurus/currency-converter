import { decodeBase64 } from "@std/encoding/base64";

const responseHeaders = {
  "content-type": "application/json; charset=utf-8",
};

type RequestParam = {
  fromCurrency: string;
  toCurrency: string;
  value: number;
};

type RouteParam = {
  method: string;
  pattern: RegExp;
  capture: (m: Array<string>) => RequestParam;
  authenticate: (r: Request) => boolean;
  handle: (r: Request, p: RequestParam) => Response;
};

const credentials = {
  user: "banker",
  password: "iLikeMoney",
};

// GET /rate/{fromCurrency}/{toCurrency}
// PUT /rate/{fromCurrency}/{toCurrency}/{value}
// GET /conversion/{fromCurrency}/{toCurrency}/{value}
const router: Array<RouteParam> = [
  {
    method: "GET",
    pattern: new RegExp("^/rate/([a-z]{3})/([a-z]{3})$", "i"),
    capture: (m: Array<string>): RequestParam => {
      return { fromCurrency: m[1], toCurrency: m[2], value: 0.0 };
    },
    authenticate: (_) => true,
    handle: getRate,
  },
  {
    method: "PUT",
    pattern: new RegExp(
      "^/rate/([a-z]{3})/([a-z]{3})/([0-9]*\\.?[0-9]+)$",
      "i",
    ),
    capture: (m: Array<string>): RequestParam => {
      return {
        fromCurrency: m[1],
        toCurrency: m[2],
        value: Number.parseFloat(m[3]),
      };
    },
    authenticate: (r: Request) => {
      const auth = r.headers.get("authorization") || "";
      const match = /^Basic ([A-Za-z0-9+/]+)=*$/.exec(auth);
      if (match === null) {
        return false;
      }
      const credentials = new TextDecoder().decode(decodeBase64(match[1]));
      console.log(credentials);
      return true;
    },
    handle: putRate,
  },
  {
    method: "GET",
    pattern: new RegExp(
      "^/conversion/([a-z]{3})/([a-z]{3})/([0-9]*\\.?[0-9]+)$",
      "i",
    ),
    capture: (m: Array<string>): RequestParam => {
      return {
        fromCurrency: m[1],
        toCurrency: m[2],
        value: Number.parseFloat(m[3]),
      };
    },
    authenticate: (_) => true,
    handle: getConversion,
  },
];

function getRate(_req: Request, data: RequestParam): Response {
  console.log(data);
  return new Response("getRate");
}

function putRate(_req: Request, data: RequestParam): Response {
  console.log(data);
  return new Response("putRate");
}

function getConversion(_req: Request, data: RequestParam): Response {
  console.log(data);
  return new Response("getConversion");
}

Deno.serve((req) => {
  const url = new URL(req.url);
  for (const { method, pattern, capture, authenticate, handle } of router) {
    if (method != req.method) {
      continue;
    }
    const match = pattern.exec(url.pathname);
    if (match === null) {
      continue;
    }
    if (!authenticate(req)) {
      return new Response(JSON.stringify({ message: "UNAUTHORIZED" }), {
        status: 401,
        headers: responseHeaders,
      });
    }
    return handle(req, capture(match));
  }
  return new Response(JSON.stringify({ message: "NOT FOUND" }), {
    status: 404,
    headers: responseHeaders,
  });
});
