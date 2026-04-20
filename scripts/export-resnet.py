import torch
import torch.nn as nn
import torchvision.models as tvm
from onnxruntime.quantization import quantize_dynamic, QuantType

weights = tvm.ResNet50_Weights.IMAGENET1K_V2
model = tvm.resnet50(weights=weights).eval()

dummy = torch.randn(1, 3, 224, 224)

# 1) Full classifier (unquantized, used as intermediate)
torch.onnx.export(
    model, dummy, "public/models/resnet50.onnx",
    opset_version=17, input_names=["input"], output_names=["logits"],
    dynamic_axes={"input": {0: "batch"}, "logits": {0: "batch"}},
)
quantize_dynamic(
    "public/models/resnet50.onnx",
    "public/models/resnet50-int8.onnx",
    weight_type=QuantType.QUInt8,
)

# 2) Feature extractor (truncated before fc)
feat_model = nn.Sequential(*list(model.children())[:-1])
torch.onnx.export(
    feat_model, dummy, "public/models/resnet50-features.onnx",
    opset_version=17, input_names=["input"], output_names=["features"],
    dynamic_axes={"input": {0: "batch"}, "features": {0: "batch"}},
)

# 3) Last-conv feature map (before avgpool) for CAM
class LastConv(nn.Module):
    def __init__(self, m):
        super().__init__()
        self.features = nn.Sequential(*list(m.children())[:-2])
    def forward(self, x):
        return self.features(x)

torch.onnx.export(
    LastConv(model), dummy, "public/models/resnet50-lastconv.onnx",
    opset_version=17, input_names=["input"], output_names=["feature_map"],
    dynamic_axes={"input": {0: "batch"}, "feature_map": {0: "batch"}},
)

# 4) FC weights for CAM
fc = model.fc
fc.weight.detach().contiguous().numpy().astype("float32").tofile(
    "public/models/resnet50-fc-weight.bin"
)
fc.bias.detach().contiguous().numpy().astype("float32").tofile(
    "public/models/resnet50-fc-bias.bin"
)

print("Done. Files in public/models/:")
import os
for f in sorted(os.listdir("public/models/")):
    size = os.path.getsize(f"public/models/{f}")
    print(f"  {f} ({size / 1024 / 1024:.1f} MB)")
