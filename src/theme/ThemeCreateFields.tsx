import React from 'react';
import { Form, Input, type FormInstance } from 'antd';
import { getI18n } from '../i18n';
import { AutoComplete } from '../component/AutoComplete';
import { TAG, FOLDER, INDEX } from '../constant';
export function ThemeCreateFields({
  prefix,
  locale,
  tags,
  onTag,
}: {
  prefix: string;
  locale: string;
  form: FormInstance;
  tags: { value: string; label: string }[];
  onTag: () => void;
}) {
  const m = getI18n(locale);
  return (
    <div style={{ width: '100%' }}>
      <Form.Item
        label={m[TAG]}
        name={`${prefix}Tag`}
        tooltip={m[`${TAG}ToolTip`]}
        rules={[
          { required: true, message: m[`${TAG}Required`] },
          { pattern: /^#[\p{L}\p{N}_/-]+$/u, message: m[`${TAG}Required3`] },
        ]}
      >
        <AutoComplete options={tags} onSelect={onTag}>
          <Input onChange={onTag} allowClear placeholder={m.PARA_TAG_PLACEHOLDER_DEFAULT} />
        </AutoComplete>
      </Form.Item>
      <Form.Item
        label={m[FOLDER]}
        name={`${prefix}Folder`}
        tooltip={m[`${FOLDER}ToolTip`]}
        rules={[{ required: true, message: m[`${FOLDER}Required`] }]}
      >
        <Input allowClear placeholder={m.PARA_FOLDER_PLACEHOLDER} />
      </Form.Item>
      <Form.Item
        label={m[INDEX]}
        name={`${prefix}Index`}
        tooltip={m[`${INDEX}ToolTip`]}
        rules={[{ required: true, message: m[`${INDEX}Required`] }]}
      >
        <Input allowClear placeholder={m.PARA_INDEX_PLACEHOLDER} />
      </Form.Item>
    </div>
  );
}
