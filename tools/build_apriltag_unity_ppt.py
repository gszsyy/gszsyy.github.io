from __future__ import annotations

from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile
import html


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets/projects/apriltag-unity-pose/apriltag-unity-stage1-progress.pptx"


SLIDES = [
    (
        "DeepTag 多面体位姿驱动 Unity",
        [
            "阶段 1 进度报告",
            "目标：在 360 度八等份可见面的立体结构上部署 Tag，输出实体结构 6DoF 位姿并驱动 Unity 虚拟物体。",
            "状态：创维 1600 已完成基础闭环验证；底层取流、IMU 同步和端侧鲁棒性约束已记录。",
        ],
    ),
    (
        "阶段 1 目标",
        [
            "立体结构旋转 360 度，按 45 度均分 8 个可观测方向。",
            "每个方向都至少可看到一个贴有 AprilTag / DeepTag 的面。",
            "通过多 Tag 刚体融合得到 xyz 平移与三轴旋转，驱动 Unity 中的虚拟物体。",
        ],
    ),
    (
        "最新技术路线答复",
        [
            "SDK 的 AprilTag 检测采用深度学习方案，对标 DeepArUco / DeepArUco++。",
            "检测网络定位 Tag 候选区域 / 热力图；角点精修网络完成亚像素角点回归。",
            "随后执行 ID 解码与纠错，最后通过 PnP + 非线性重投影精修输出位姿。",
            "该路线面向反光、弱暗光、运动模糊、弯曲贴附和遮挡等传统方案易失效工况。",
        ],
    ),
    (
        "已完成事项",
        [
            "已在创维 1600 上完成初步闭环验证，可以进行 Unity 虚拟物体基础跟随。",
            "当前通过分时复用方式获取约 30fps 灰度图像。",
            "在无法严格对应 IMU 数据的约束下，已完成基础精度、稳定性和可驱动性验证。",
            "阶段 1 需求问题已在参考 README 中完成答复。",
        ],
    ),
    (
        "README 进度答复",
        [
            "Q1：创维真机是硬依赖；算法主体可先离线推进，但标定、性能调优和 30 分钟稳定性必须在真机完成。",
            "Q2：需明确取流 API、分辨率、帧率、像素格式、相机内参、畸变参数、外参/坐标系、时间戳和 IMU 可用性。",
            "Q3：Tag 尺寸初步参考 22~28mm；材质需抗反光、可贴合曲面、耐磨耐汗；数量采用多 Tag 冗余分布。",
        ],
    ),
    (
        "当前限制",
        [
            "尚未接入创维底层取流，当前采用分时复用方式获取灰度帧。",
            "灰度帧无法严格对应 IMU 数据，运动补偿和时序融合受限。",
            "DeepTag 端侧实时性依赖 NNAPI/NPU 或等价端侧加速能力。",
            "当前 QC 关注检测置信度、角点残差、重投影误差、帧延迟和位姿抖动。",
        ],
    ),
    (
        "当前交付物",
        [
            "创维 1600 初步闭环验证结论。",
            "DeepTag 技术路线和端侧工程化约束说明。",
            "第一代 4.stl 与第二代 2.stl 结构模型文件及网页三维预览。",
            "网页进度报告和 PPT 进度报告。",
        ],
    ),
    (
        "验收口径",
        [
            "单 Tag 正对稳定叠加，多 Tag 同时检测和融合。",
            "暗光、正常光、强光、运动模糊、25/50/75% 遮挡场景覆盖。",
            "0.3m 到 3m 距离范围，30 分钟稳定性测试。",
            "验收记录覆盖位姿叠加效果、可见距离、稳定运行时长和 Unity 驱动表现。",
        ],
    ),
]


def esc(text: str) -> str:
    return html.escape(text, quote=True)


def content_types(slide_count: int) -> str:
    overrides = "\n".join(
        f'<Override PartName="/ppt/slides/slide{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
        for i in range(1, slide_count + 1)
    )
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  {overrides}
</Types>'''


def root_rels() -> str:
    return '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>'''


def presentation(slide_count: int) -> str:
    ids = "\n".join(
        f'<p:sldId id="{255 + i}" r:id="rId{i}"/>' for i in range(1, slide_count + 1)
    )
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId{slide_count + 1}"/></p:sldMasterIdLst>
  <p:sldIdLst>{ids}</p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000" type="wide"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>'''


def presentation_rels(slide_count: int) -> str:
    rels = "\n".join(
        f'<Relationship Id="rId{i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide{i}.xml"/>'
        for i in range(1, slide_count + 1)
    )
    rels += f'\n<Relationship Id="rId{slide_count + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>'
    rels += f'\n<Relationship Id="rId{slide_count + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>'
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">{rels}
</Relationships>'''


def shape(shape_id: int, name: str, x: int, y: int, cx: int, cy: int, text: str, size: int = 2400, bold: bool = False, fill: str | None = None) -> str:
    fill_xml = f'<a:solidFill><a:srgbClr val="{fill}"/></a:solidFill>' if fill else '<a:noFill/>'
    bold_attr = ' b="1"' if bold else ""
    return f'''<p:sp>
  <p:nvSpPr><p:cNvPr id="{shape_id}" name="{esc(name)}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
  <p:spPr><a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom>{fill_xml}</p:spPr>
  <p:txBody><a:bodyPr wrap="square"/><a:lstStyle/><a:p><a:r><a:rPr lang="zh-CN" sz="{size}"{bold_attr}><a:solidFill><a:srgbClr val="172033"/></a:solidFill></a:rPr><a:t>{esc(text)}</a:t></a:r><a:endParaRPr lang="zh-CN" sz="{size}"/></a:p></p:txBody>
</p:sp>'''


def slide_xml(title: str, bullets: list[str], idx: int) -> str:
    bullet_text = "\n".join(f"• {line}" for line in bullets)
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="EFE2C4"/></a:solidFill><a:effectLst/></p:bgPr></p:bg><p:spTree>
    <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
    {shape(2, "Title", 620000, 520000, 10800000, 860000, title, 3600, True)}
    {shape(3, "Body", 760000, 1600000, 10600000, 4200000, bullet_text, 2300)}
    {shape(4, "Footer", 760000, 6100000, 9800000, 360000, f"DeepTag 多面体位姿驱动 Unity · 阶段 1 进度报告 · {idx}/{len(SLIDES)}", 1300, False)}
  </p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>'''


def empty_rels() -> str:
    return '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>'''


def theme() -> str:
    return '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Stage1">
  <a:themeElements><a:clrScheme name="Stage1"><a:dk1><a:srgbClr val="172033"/></a:dk1><a:lt1><a:srgbClr val="FFFDF3"/></a:lt1><a:dk2><a:srgbClr val="0B6B57"/></a:dk2><a:lt2><a:srgbClr val="EFE2C4"/></a:lt2><a:accent1><a:srgbClr val="0B6B57"/></a:accent1><a:accent2><a:srgbClr val="C9A24A"/></a:accent2><a:accent3><a:srgbClr val="C8587B"/></a:accent3><a:accent4><a:srgbClr val="6C5B37"/></a:accent4><a:accent5><a:srgbClr val="193327"/></a:accent5><a:accent6><a:srgbClr val="F3E8CD"/></a:accent6><a:hlink><a:srgbClr val="0B6B57"/></a:hlink><a:folHlink><a:srgbClr val="C8587B"/></a:folHlink></a:clrScheme><a:fontScheme name="Stage1"><a:majorFont><a:latin typeface="Aptos Display"/><a:ea typeface="Microsoft YaHei"/></a:majorFont><a:minorFont><a:latin typeface="Aptos"/><a:ea typeface="Microsoft YaHei"/></a:minorFont></a:fontScheme><a:fmtScheme name="Stage1"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements>
</a:theme>'''


def slide_master() -> str:
    return '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="1" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles/>
</p:sldMaster>'''


def slide_layout() -> str:
    return '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">
  <p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>'''


def props() -> tuple[str, str]:
    core = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>DeepTag 多面体位姿驱动 Unity 阶段 1 进度报告</dc:title><dc:creator>gszsyy GitHub Pages</dc:creator></cp:coreProperties>'''
    app = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Codex static PPTX builder</Application><Slides>{len(SLIDES)}</Slides></Properties>'''
    return core, app


def build() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(OUT, "w", ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", content_types(len(SLIDES)))
        z.writestr("_rels/.rels", root_rels())
        z.writestr("ppt/presentation.xml", presentation(len(SLIDES)))
        z.writestr("ppt/_rels/presentation.xml.rels", presentation_rels(len(SLIDES)))
        z.writestr("ppt/theme/theme1.xml", theme())
        z.writestr("ppt/slideMasters/slideMaster1.xml", slide_master())
        z.writestr("ppt/slideMasters/_rels/slideMaster1.xml.rels", '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/></Relationships>')
        z.writestr("ppt/slideLayouts/slideLayout1.xml", slide_layout())
        z.writestr("ppt/slideLayouts/_rels/slideLayout1.xml.rels", empty_rels())
        for idx, (title, bullets) in enumerate(SLIDES, start=1):
            z.writestr(f"ppt/slides/slide{idx}.xml", slide_xml(title, bullets, idx))
            z.writestr(f"ppt/slides/_rels/slide{idx}.xml.rels", empty_rels())
        core, app = props()
        z.writestr("docProps/core.xml", core)
        z.writestr("docProps/app.xml", app)
    print(OUT)


if __name__ == "__main__":
    build()
