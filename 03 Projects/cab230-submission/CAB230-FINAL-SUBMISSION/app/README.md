# CAB230 Rentals Client Application

This folder contains the client-side React application for the CAB230 rentals project.

## Website Location

- Source code: `src/`
- Public assets: `public/`
- Built website output: `dist/`
- Main HTML entry file: `index.html`

The built website in `dist/` should be served through a local preview/static server rather than opened directly from the file system.

## Run the Application

Open a terminal in this `app/` folder and run:

```powershell
npm.cmd install
npm.cmd run dev
```

## Build and Preview

```powershell
npm.cmd run build
npx.cmd serve -s dist
```

Open the local URL shown in the terminal to view the built website.

If using Command Prompt, macOS, or Linux, the same commands can usually be run without `.cmd`.

The application connects to the CAB230 API at:

`http://4.237.58.241:3000`
