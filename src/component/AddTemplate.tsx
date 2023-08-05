import { TFile } from 'obsidian';
import * as React from 'react';
import { useState } from 'react';
import { useApp } from 'src/hooks/useApp';

export const AddTemplate = () => {
  const { app, settings } = useApp() || {};
  const [ name, setName ] = useState('');

  return (
    <>
      <h4>Template</h4>
      <form
        onSubmit={async (event) => {
          event.preventDefault();

          if (!app || !settings) {
            return;
          }

          // TODO: 设置模版文件地址
          const folder =
            app.vault.getRoot().path + `${settings.projectsPath}/${name}`;
          const file = folder + '/README.md';

          const templateTFile =
            app.vault.getAbstractFileByPath('模版/PARA/README.md');

          if (templateTFile instanceof TFile) {
            const templateContent = await app.vault.read(templateTFile);
            app.vault.createFolder(folder);
            app.vault.create(file, templateContent);
          }
        }}
      >
        <div>
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <button type="submit">Add</button>
      </form>
    </>
  );
};
