"""
Material Matcher - AI 기반 자재 유사도 검색 모듈
=====================================================
자재샘플북 앱에 플러그인 형태로 통합되는 독립 SDK입니다.

사용 예시:
    from material_matcher import MaterialMatcher
    matcher = MaterialMatcher()
    results = matcher.search(image_path="photo.jpg")
    # 반환: [{"code": "LG-1234", "name": "모던 화이트", "score": 0.97}, ...]
"""

__version__ = "0.1.0"
__author__  = "Material Matcher Dev Team"
