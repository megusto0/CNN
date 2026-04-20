export interface Variant {
  number: number;
  dataset: {
    name: string;
    classes: number;
    resolution: string;
    size_train: number;
  };
  backbone: {
    name: string;
    params_M: number;
    expected_input: string;
  };
  notes: string;
}

export interface ArchLayer {
  type: string;
  in?: number;
  out?: number;
  kernel?: number;
  stride?: number;
  pad?: number;
  out_shape: number[];
  params?: number;
  blocks?: number;
}

export interface Architecture {
  name: string;
  input: number[];
  total_params_M: number;
  flops_G: number;
  top1_imagenet: number;
  layers: ArchLayer[];
}

export interface TorchvisionModel {
  model: string;
  params_M: number;
  top1: number;
  top5: number;
  gflops: number;
  size_MB: number;
  year: number;
}

export interface ImageNetClass {
  id: number;
  en: string;
  ru: string;
}
