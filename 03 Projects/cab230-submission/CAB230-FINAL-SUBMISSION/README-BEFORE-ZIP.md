# CAB230 Final Submission Folder

This is the final CAB230 submission folder to review before creating the final ZIP.

## Where the Website Is

The client-side website is in:

`app/`

The built website output is in:

`app/dist/`

For testing on Windows PowerShell, open a terminal in `app/` and run:

```powershell
npm.cmd install
npm.cmd run build
npx.cmd serve -s dist
```

Then open the local URL shown in the terminal.

If using Command Prompt, macOS, or Linux, the same commands can usually be run without `.cmd`:

```powershell
npm install
npm run build
npx serve -s dist
```

## Folder Contents

- `app/` contains the React client application, public assets, source files, config files, package files, and the latest built `dist/` folder.
- `report/` contains the Word report and PDF export.
- `screenshots/` contains screenshots used while preparing the report.

Do not include `node_modules/` in the final ZIP.
