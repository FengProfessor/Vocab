import React from 'react';
import { Form, Input, Modal } from '@/components/ui/Primitives';
import { CreateClassroomFormValues } from '@/features/teacher/types/CreateClassroomFormValues';
import { CreateClassroomModalProps } from '@/features/teacher/types/CreateClassroomModalProps';

/**
 * Dialog that registers a new classroom; the server generates the invite code.
 */
export const CreateClassroomModal: React.FC<CreateClassroomModalProps> = ({
  open,
  isSubmitting = false,
  onClose,
  onCreate,
}) => {
  const [form] = Form.useForm<CreateClassroomFormValues>();

  const handleOk = async (): Promise<void> => {
    const values = await form.validateFields();
    onCreate(values.name.trim(), values.description?.trim() ?? '');
    form.resetFields();
  };

  return (
    <Modal
      title="Tạo lớp học mới"
      open={open}
      onCancel={onClose}
      onOk={() => void handleOk()}
      confirmLoading={isSubmitting}
      okText="Khởi tạo lớp"
      cancelText="Hủy"
      width={480}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="Tên lớp học"
          rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập tên lớp học' }]}
        >
          <Input placeholder="Ví dụ: Lớp TOEIC 650+" maxLength={120} />
        </Form.Item>
        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={3} placeholder="Mục tiêu đầu ra, lịch học..." maxLength={500} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
