export interface Bag {
  id: string;
  name: string;
  description: string;
  price: number;
  images: {
    id: string;
    url: string;
    isDefault: boolean;
    publicId: string;
  }[];
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BagFormData {
  name: string;
  description: string;
  price: number;
  isAvailable: boolean;
  images: {
    url: string;
    publicId: string;
    isDefault: boolean;
  }[];
}

export interface UploadItem {
  id: string;
  file?: File;
  previewUrl: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
  url?: string;
  publicId?: string;
  error?: string;
  isDefault?: boolean;
}
