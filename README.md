# HerAccess

### A web application for women's reproductive health access in the Illinois and Indiana. 

<hr>

## Table of Contents

- About
- Overview of the project structure
    - Server
    - Dist
    - Database
    - Client
    - Attached Assets
- Contributors

<hr>

## About

HerAccess is a web application built for the 2025 InnovateHer hackathon. It is aimed to help women in Illinois and Indiana gain access to reproductive health resources in their area. 

<hr>

## Server

```code
📁 server  
├── 📁 utils   
│   ├── 📄 geocoding.ts  
│   ├── 📄 news-scraper.ts   
│   ├── 📄 scheduler.ts 
│   ├── 📄 scraper.ts   
│   └── 📄 static-data.ts  
├── 📄 index.ts  
├── 📄 routes.ts   
└── 📄 vite.ts
```
<hr>

## Dist

```code
📁 dist   
└── 📁 public  
    └── 📄 1.png
```

<hr>

## Database

```code
📁 database   
├── 📄 index.ts  
└── 📄 schema.ts
```

<hr>

## Client

```code
📁 Client
├── 📁 public
│   └── (... omitted for brevity)
├── 📁 src
│   ├── 📁 components
│   │   ├── 📁 ui
│   │   │   └── (... omitted for brevity)
│   │   ├── 📄 ChatBot.tsx
│   │   ├── 📄 Navigation.tsx
│   │   ├── 📄 ProtectedRoute.tsx
│   │   ├── 📄 ResourceMap.tsc
│   │   └── 📄 UserAuth.tsx
│   ├── 📁 hooks
│   │   ├── 📄 user-mobile.tsx
│   │   └── 📄 use-toast.ts
│   ├── 📁 lib
│   │   ├── 📄 auth.tsx
│   │   ├── 📄 queryClient.ts
│   │   └── 📄 utils.ts
│   ├── 📁 pages
│   │   ├── 📄 Home.tsx
│   │   ├── 📄 Laws.ts
│   │   ├── 📄 Map.tsx
│   │   ├── 📄 not-found.ts
│   │   ├── 📄 Petitions.tsx
│   │   ├── 📄 SignIn.ts
│   │   └── 📄 TakeAction.ts
│   ├── 📄 App.tsx
│   ├── 📄 env.d.ts
│   ├── 📄 index.css
│   └── 📄 main.tsx
└── 📄 index.html
```

## Attached Assets

```code
📁 attached_assets   
└── (... omitted for brevity)
```

<hr>

<hr>

## Contributors

HerAccess was created by Josephine Bradley, Samiksha Gupta, Remley Hooker, and Ileema Pradhan
