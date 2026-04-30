# Start Here

This is the final folder for the CAB230 submission package.

## What to Check

1. Open `report/report.docx` and review the written report.
2. Check `screenshots/` for the image evidence used while preparing the report.
3. Open `app/` for the actual client-side website project.
4. Use `app/dist/` as the built website output.

## Testing the Website

Open a terminal in `app/` and run:

```powershell
npm.cmd install
npm.cmd run build
npx.cmd serve -s dist
```

Open the local URL shown in the terminal to view the website.

If using Command Prompt, macOS, or Linux, the same commands can usually be run without `.cmd`:

```powershell
npm install
npm run build
npx serve -s dist
```

Do not include `node_modules/` in the final ZIP.
