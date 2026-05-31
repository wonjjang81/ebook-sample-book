import { MainLayout, SidebarContent, SidebarHeader, SidebarNav, SidebarNavItem, useSidebar } from '@/components/Layout';
import { SampleCard } from '@/components/SampleCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Settings, ChevronDown, ChevronRight, Download, Save, Trash2, Upload, Check, Heart, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PublishModal } from '@/components/PublishModal';
import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Mock 데이터 - 5단계 계층 구조 (카테고리 > 브랜드 > 소재유형 > 제품군 > 라인)
const CATEGORIES = [
  {
    id: 1,
    name: '도배',
    brands: [
      {
        name: '개나리',
        materialTypes: [
          {
            name: '실크',
            groups: [
              { name: '방염벽지', lines: ['프리모', 'Plaster&Paint', 'Simple Fabric', 'Urban Fabric', 'Kids', 'Ceiling'] },
            ],
          },
          {
            name: '합지',
            groups: [
              { name: '광폭합지', lines: ['트랜디'] },
              { name: '일반벽지', lines: ['스탠다드', '내추럴'] },
            ],
          },
        ],
      },
      {
        name: '신한',
        materialTypes: [
          {
            name: '실크',
            groups: [{ name: '일반벽지', lines: ['트렌디', '모던'] }],
          },
        ],
      },
      {
        name: 'LX',
        materialTypes: [
          {
            name: '실크',
            groups: [{ name: 'LX벽지', lines: ['럭셔리', '프리스티지'] }],
          },
        ],
      },
    ],
  },
  {
    id: 2,
    name: '타일',
    brands: [
      { name: '세라믹', materialTypes: [{ name: '일반', groups: [{ name: '세라믹타일', lines: ['클래식', '모던'] }] }] },
      { name: '포세린', materialTypes: [{ name: '일반', groups: [{ name: '포세린타일', lines: ['프리미엄', '스탠다드'] }] }] },
      { name: '천연석', materialTypes: [{ name: '일반', groups: [{ name: '천연석타일', lines: ['럭셔리', '내추럴'] }] }] },
    ],
  },
  {
    id: 3,
    name: '필름',
    brands: [
      { name: '3M', materialTypes: [{ name: '일반', groups: [{ name: '인테리어필름', lines: ['프리미엄', '스탠다드'] }] }] },
      { name: '아보트', materialTypes: [{ name: '일반', groups: [{ name: '인테리어필름', lines: ['클래식', '모던'] }] }] },
      { name: '프리미엄', materialTypes: [{ name: '일반', groups: [{ name: '인테리어필름', lines: ['럭셔리', '프리스티지'] }] }] },
    ],
  },
  {
    id: 4,
    name: '장판',
    brands: [
      { name: '럭셔리', materialTypes: [{ name: '일반', groups: [{ name: '장판', lines: ['프리미엄', '클래식'] }] }] },
      { name: '스탠다드', materialTypes: [{ name: '일반', groups: [{ name: '장판', lines: ['모던', '클래식'] }] }] },
      { name: '에코', materialTypes: [{ name: '일반', groups: [{ name: '장판', lines: ['내추럴', '우드'] }] }] },
    ],
  },
  {
    id: 5,
    name: '마루',
    brands: [
      { name: '오크', materialTypes: [{ name: '일반', groups: [{ name: '원목마루', lines: ['클래식', '모던'] }] }] },
      { name: '월넛', materialTypes: [{ name: '일반', groups: [{ name: '원목마루', lines: ['프리미엄', '스탠다드'] }] }] },
      { name: '티크', materialTypes: [{ name: '일반', groups: [{ name: '원목마루', lines: ['럭셔리', '내추럴'] }] }] },
    ],
  },
  {
    id: 6,
    name: '줄눈',
    brands: [
      { name: '에폭시', materialTypes: [{ name: '일반', groups: [{ name: '줄눈재', lines: ['화이트', '블랙'] }] }] },
      { name: '실리콘', materialTypes: [{ name: '일반', groups: [{ name: '줄눈재', lines: ['투명', '화이트'] }] }] },
      { name: '시멘트', materialTypes: [{ name: '일반', groups: [{ name: '줄눈재', lines: ['그레이', '화이트'] }] }] },
    ],
  },
  {
    id: 7,
    name: '탄성',
    brands: [
      { name: '우레탄', materialTypes: [{ name: '일반', groups: [{ name: '탄성코트', lines: ['광택', '무광'] }] }] },
      { name: '아크릴', materialTypes: [{ name: '일반', groups: [{ name: '탄성코트', lines: ['광택', '무광'] }] }] },
      { name: '폴리우레탄', materialTypes: [{ name: '일반', groups: [{ name: '탄성코트', lines: ['프리미엄', '스탠다드'] }] }] },
    ],
  },
];

// Mock 데이터 - 샘플
const MOCK_SAMPLES = {
  1: [
    // --- 트랜디 컬렉션 (광폭 합지) ---
    { id: '1-trendy-1', productNo: '39369-6', name: '트랜디 쿨그레이', brand: '개나리', line: '트랜디', materialType: '합지', specs: ['합지', '광폭', '피톤치드 함유'], image: '/images/products/gaenari/trendy/39369-6.jpg' },
    { id: '1-trendy-2', productNo: '28352-1', name: '트랜디 심플화이트', brand: '개나리', line: '트랜디', materialType: '합지', specs: ['합지', '광폭', '피톤치드 함유'], image: '/images/products/gaenari/trendy/28352-1.jpg' },
    { id: '1-trendy-3', productNo: '28352-2', name: '트랜디 라이트그레이지', brand: '개나리', line: '트랜디', materialType: '합지', specs: ['합지', '광폭', '피톤치드 함유'], image: '/images/products/gaenari/trendy/28352-2.jpg' },
    { id: '1-trendy-4', productNo: '28352-3', name: '트랜디 라이트그레이', brand: '개나리', line: '트랜디', materialType: '합지', specs: ['합지', '광폭', '피톤치드 함유'], image: '/images/products/gaenari/trendy/28352-3.jpg' },
    { id: '1-trendy-5', productNo: '28352-4', name: '트랜디 그레이', brand: '개나리', line: '트랜디', materialType: '합지', specs: ['합지', '광폭', '피톤치드 함유'], image: '/images/products/gaenari/trendy/28352-4.jpg' },
    { id: '1-trendy-6', productNo: '28349-1', name: '트랜디 오프화이트', brand: '개나리', line: '트랜디', materialType: '합지', specs: ['합지', '광폭', '피톤치드 함유'], image: '/images/products/gaenari/trendy/28349-1.jpg' },
    { id: '1-trendy-7', productNo: '28348-2', name: '트랜디 라이트 그레이', brand: '개나리', line: '트랜디', materialType: '합지', specs: ['합지', '광폭', '피톤치드 함유'], image: '/images/products/gaenari/trendy/28348-2.jpg' },
    { id: '1-trendy-8', productNo: '39034-1', name: '트랜디 화이트', brand: '개나리', line: '트랜디', materialType: '합지', specs: ['합지', '광폭', '피톤치드 함유'], image: '/images/products/gaenari/trendy/39034-1.jpg' },
    { id: '1-trendy-9', productNo: '28323-1', name: '트랜디 화이트', brand: '개나리', line: '트랜디', materialType: '합지', specs: ['합지', '광폭', '피톤치드 함유'], image: '/images/products/gaenari/trendy/28323-1.jpg' },
    { id: '1-trendy-10', productNo: '28310-2', name: '트랜디 라이트그레이', brand: '개나리', line: '트랜디', materialType: '합지', specs: ['합지', '광폭', '피톤치드 함유'], image: '/images/products/gaenari/trendy/28310-2.jpg' },
    { id: '1-trendy-11', productNo: '29080-1', name: '트랜디 화이트', brand: '개나리', line: '트랜디', materialType: '합지', specs: ['합지', '광폭', '피톤치드 함유'], image: '/images/products/gaenari/trendy/29080-1.jpg' },
    { id: '1-trendy-12', productNo: '29080-2', name: '트랜디 화이트', brand: '개나리', line: '트랜디', materialType: '합지', specs: ['합지', '광폭', '피톤치드 함유'], image: '/images/products/gaenari/trendy/29080-2.jpg' },
{ id: '1-new-1', productNo: '28293-1', name: '트랜디 천장용 화이트', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: '천장용', description: '천장 시공에 최적화된 프리미엄 합지입니다. 피톤치드 함유 및 수성잉크 인쇄로 친환경 인증을 받은 천장 전용 합지입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '천장용'], image: '/images/products/gaenari/trendy/28293-1.jpg' },
  { id: '1-new-2', productNo: '28293-2', name: '트랜디 천장용 화이트', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: '천장용', description: '천장 시공에 최적화된 프리미엄 합지입니다. 피톤치드 함유 및 수성잉크 인쇄로 친환경 인증을 받은 천장 전용 합지입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '천장용'], image: '/images/products/gaenari/trendy/28293-2.jpg' },
  { id: '1-new-3', productNo: '28336-1', name: '트랜디 28336 화이트', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: '28336', description: '프리미엄 합지 트랜디 제품입니다. 피톤치드 함유 및 수성잉크 인쇄로 친환경 인증을 받은 제품입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증'], image: '/images/products/gaenari/trendy/28336-1.jpg' },
  { id: '1-new-4', productNo: '28336-2', name: '트랜디 28336 아이보리', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: '28336', description: '프리미엄 합지 트랜디 제품입니다. 피톤치드 함유 및 수성잉크 인쇄로 친환경 인증을 받은 제품입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증'], image: '/images/products/gaenari/trendy/28336-2.jpg' },
  { id: '1-new-5', productNo: '28348-3', name: '트랜디 28348 그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: '28348', description: '프리미엄 합지 트랜디 제품입니다. 피톤치드 함유 및 수성잉크 인쇄로 친환경 인증을 받은 제품입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증'], image: '/images/products/gaenari/trendy/28348-3.jpg' },
  { id: '1-new-6', productNo: '28349-2', name: '트랜디 28349 아이보리', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: '28349', description: '프리미엄 합지 트랜디 제품입니다. 피톤치드 함유 및 수성잉크 인쇄로 친환경 인증을 받은 제품입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증'], image: '/images/products/gaenari/trendy/28349-2.jpg' },
  { id: '1-new-7', productNo: '28349-3', name: '트랜디 28349 베이지', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: '28349', description: '프리미엄 합지 트랜디 제품입니다. 피톤치드 함유 및 수성잉크 인쇄로 친환경 인증을 받은 제품입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증'], image: '/images/products/gaenari/trendy/28349-3.jpg' },
  { id: '1-new-8', productNo: '28349-7', name: '트랜디 28349 그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: '28349', description: '프리미엄 합지 트랜디 제품입니다. 피톤치드 함유 및 수성잉크 인쇄로 친환경 인증을 받은 제품입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증'], image: '/images/products/gaenari/trendy/28349-7.jpg' },
  { id: '1-new-9', productNo: '28352-5', name: '트랜디 La Beauté 그레이베이지', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'La Beauté', description: '뷰티가 공간이 되는 고급스러운 프리미엄 합지입니다. La Beauté — where beauty becomes space. 아름다움이 공간이 되는 순간을 담았습니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증'], image: '/images/products/gaenari/trendy/28352-5.jpg' },
  { id: '1-new-10', productNo: '28352-6', name: '트랜디 La Beauté 딥그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'La Beauté', description: '뷰티가 공간이 되는 고급스러운 프리미엄 합지입니다. La Beauté — where beauty becomes space. 아름다움이 공간이 되는 순간을 담았습니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증'], image: '/images/products/gaenari/trendy/28352-6.jpg' },
  { id: '1-new-11', productNo: '28363-1', name: '트랜디 Rough-Soft Harmony 화이트', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Rough-Soft Harmony', description: '거칠고 부드러운 조화의 텍스처 프리미엄 합지입니다. 거친 질감과 부드러운 질감이 조화를 이루어 공간에 독특한 깊이감을 더합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '믹스 텍스처'], image: '/images/products/gaenari/trendy/28363-1.jpg' },
  { id: '1-new-12', productNo: '28363-2', name: '트랜디 Rough-Soft Harmony 아이보리', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Rough-Soft Harmony', description: '거칠고 부드러운 조화의 텍스처 프리미엄 합지입니다. 거친 질감과 부드러운 질감이 조화를 이루어 공간에 독특한 깊이감을 더합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '믹스 텍스처'], image: '/images/products/gaenari/trendy/28363-2.jpg' },
  { id: '1-new-13', productNo: '28363-3', name: '트랜디 Rough-Soft Harmony 베이지', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Rough-Soft Harmony', description: '거칠고 부드러운 조화의 텍스처 프리미엄 합지입니다. 거친 질감과 부드러운 질감이 조화를 이루어 공간에 독특한 깊이감을 더합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '믹스 텍스처'], image: '/images/products/gaenari/trendy/28363-3.jpg' },
  { id: '1-new-14', productNo: '28363-4', name: '트랜디 Rough-Soft Harmony 그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Rough-Soft Harmony', description: '거칠고 부드러운 조화의 텍스처 프리미엄 합지입니다. 거친 질감과 부드러운 질감이 조화를 이루어 공간에 독특한 깊이감을 더합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '믹스 텍스처'], image: '/images/products/gaenari/trendy/28363-4.jpg' },
  { id: '1-new-15', productNo: '28364-1', name: '트랜디 Realistic Stucco 화이트', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Realistic Stucco', description: '리얼한 스투코 페인트 질감의 프리미엄 합지입니다. 실제 스투코 페인트를 칠한 듯한 리얼한 질감으로 공간에 고급스러운 유럽풍 분위기를 연출합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '스투코 텍스처'], image: '/images/products/gaenari/trendy/28364-1.jpg' },
  { id: '1-new-16', productNo: '28364-2', name: '트랜디 Realistic Stucco 아이보리', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Realistic Stucco', description: '리얼한 스투코 페인트 질감의 프리미엄 합지입니다. 실제 스투코 페인트를 칠한 듯한 리얼한 질감으로 공간에 고급스러운 유럽풍 분위기를 연출합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '스투코 텍스처'], image: '/images/products/gaenari/trendy/28364-2.jpg' },
  { id: '1-new-17', productNo: '28364-3', name: '트랜디 Realistic Stucco 베이지', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Realistic Stucco', description: '리얼한 스투코 페인트 질감의 프리미엄 합지입니다. 실제 스투코 페인트를 칠한 듯한 리얼한 질감으로 공간에 고급스러운 유럽풍 분위기를 연출합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '스투코 텍스처'], image: '/images/products/gaenari/trendy/28364-3.jpg' },
  { id: '1-new-18', productNo: '28364-5', name: '트랜디 Realistic Stucco 그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Realistic Stucco', description: '리얼한 스투코 페인트 질감의 프리미엄 합지입니다. 실제 스투코 페인트를 칠한 듯한 리얼한 질감으로 공간에 고급스러운 유럽풍 분위기를 연출합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '스투코 텍스처'], image: '/images/products/gaenari/trendy/28364-5.jpg' },
  { id: '1-new-19', productNo: '28364-6', name: '트랜디 Realistic Stucco 딥그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Realistic Stucco', description: '리얼한 스투코 페인트 질감의 프리미엄 합지입니다. 실제 스투코 페인트를 칠한 듯한 리얼한 질감으로 공간에 고급스러운 유럽풍 분위기를 연출합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '스투코 텍스처'], image: '/images/products/gaenari/trendy/28364-6.jpg' },
  { id: '1-new-20', productNo: '28365-1', name: '트랜디 Simple Painting 화이트', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Simple Painting', description: '심플한 페인팅 질감의 프리미엄 합지입니다. 깔끔하고 단순한 페인트 질감으로 어떤 인테리어 스타일에도 잘 어울리는 베이직 합지입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '페인팅 텍스처'], image: '/images/products/gaenari/trendy/28365-1.jpg' },
  { id: '1-new-21', productNo: '28365-2', name: '트랜디 Simple Painting 아이보리', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Simple Painting', description: '심플한 페인팅 질감의 프리미엄 합지입니다. 깔끔하고 단순한 페인트 질감으로 어떤 인테리어 스타일에도 잘 어울리는 베이직 합지입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '페인팅 텍스처'], image: '/images/products/gaenari/trendy/28365-2.jpg' },
  { id: '1-new-22', productNo: '28365-3', name: '트랜디 Simple Painting 베이지', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Simple Painting', description: '심플한 페인팅 질감의 프리미엄 합지입니다. 깔끔하고 단순한 페인트 질감으로 어떤 인테리어 스타일에도 잘 어울리는 베이직 합지입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '페인팅 텍스처'], image: '/images/products/gaenari/trendy/28365-3.jpg' },
  { id: '1-new-23', productNo: '28365-5', name: '트랜디 Simple Painting 그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Simple Painting', description: '심플한 페인팅 질감의 프리미엄 합지입니다. 깔끔하고 단순한 페인트 질감으로 어떤 인테리어 스타일에도 잘 어울리는 베이직 합지입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '페인팅 텍스처'], image: '/images/products/gaenari/trendy/28365-5.jpg' },
  { id: '1-new-24', productNo: '28366-1', name: '트랜디 28366 화이트', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: '28366', description: '프리미엄 합지 트랜디 제품입니다. 피톤치드 함유 및 수성잉크 인쇄로 친환경 인증을 받은 제품입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증'], image: '/images/products/gaenari/trendy/28366-1.jpg' },
  { id: '1-new-25', productNo: '28366-2', name: '트랜디 28366 아이보리', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: '28366', description: '프리미엄 합지 트랜디 제품입니다. 피톤치드 함유 및 수성잉크 인쇄로 친환경 인증을 받은 제품입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증'], image: '/images/products/gaenari/trendy/28366-2.jpg' },
  { id: '1-new-26', productNo: '28366-3', name: '트랜디 28366 베이지', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: '28366', description: '프리미엄 합지 트랜디 제품입니다. 피톤치드 함유 및 수성잉크 인쇄로 친환경 인증을 받은 제품입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증'], image: '/images/products/gaenari/trendy/28366-3.jpg' },
  { id: '1-new-27', productNo: '28366-4', name: '트랜디 28366 그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: '28366', description: '프리미엄 합지 트랜디 제품입니다. 피톤치드 함유 및 수성잉크 인쇄로 친환경 인증을 받은 제품입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증'], image: '/images/products/gaenari/trendy/28366-4.jpg' },
  { id: '1-new-28', productNo: '28370-1', name: '트랜디 28370 화이트', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: '28370', description: '프리미엄 합지 트랜디 제품입니다. 피톤치드 함유 및 수성잉크 인쇄로 친환경 인증을 받은 제품입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증'], image: '/images/products/gaenari/trendy/28370-1.jpg' },
  { id: '1-new-29', productNo: '28370-2', name: '트랜디 28370 아이보리', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: '28370', description: '프리미엄 합지 트랜디 제품입니다. 피톤치드 함유 및 수성잉크 인쇄로 친환경 인증을 받은 제품입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증'], image: '/images/products/gaenari/trendy/28370-2.jpg' },
  { id: '1-new-30', productNo: '28370-5', name: '트랜디 28370 그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: '28370', description: '프리미엄 합지 트랜디 제품입니다. 피톤치드 함유 및 수성잉크 인쇄로 친환경 인증을 받은 제품입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증'], image: '/images/products/gaenari/trendy/28370-5.jpg' },
  { id: '1-new-31', productNo: '28371-1', name: '트랜디 Raw Urban Touch 화이트', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Raw Urban Touch', description: '도시적인 로우 텍스처의 패브릭 프리미엄 합지입니다. 거친 도시의 감성을 담아낸 Raw Urban Touch 컨셉으로 모던하고 개성 있는 공간을 연출합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '어반 텍스처'], image: '/images/products/gaenari/trendy/28371-1.jpg' },
  { id: '1-new-32', productNo: '28371-2', name: '트랜디 Raw Urban Touch 아이보리', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Raw Urban Touch', description: '도시적인 로우 텍스처의 패브릭 프리미엄 합지입니다. 거친 도시의 감성을 담아낸 Raw Urban Touch 컨셉으로 모던하고 개성 있는 공간을 연출합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '어반 텍스처'], image: '/images/products/gaenari/trendy/28371-2.jpg' },
  { id: '1-new-33', productNo: '28371-3', name: '트랜디 Raw Urban Touch 베이지', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Raw Urban Touch', description: '도시적인 로우 텍스처의 패브릭 프리미엄 합지입니다. 거친 도시의 감성을 담아낸 Raw Urban Touch 컨셉으로 모던하고 개성 있는 공간을 연출합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '어반 텍스처'], image: '/images/products/gaenari/trendy/28371-3.jpg' },
  { id: '1-new-34', productNo: '28371-4', name: '트랜디 Raw Urban Touch 라이트그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Raw Urban Touch', description: '도시적인 로우 텍스처의 패브릭 프리미엄 합지입니다. 거친 도시의 감성을 담아낸 Raw Urban Touch 컨셉으로 모던하고 개성 있는 공간을 연출합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '어반 텍스처'], image: '/images/products/gaenari/trendy/28371-4.jpg' },
  { id: '1-new-35', productNo: '28371-5', name: '트랜디 Raw Urban Touch 그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Raw Urban Touch', description: '도시적인 로우 텍스처의 패브릭 프리미엄 합지입니다. 거친 도시의 감성을 담아낸 Raw Urban Touch 컨셉으로 모던하고 개성 있는 공간을 연출합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '어반 텍스처'], image: '/images/products/gaenari/trendy/28371-5.jpg' },
  { id: '1-new-36', productNo: '28371-9', name: '트랜디 Raw Urban Touch 딥그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Raw Urban Touch', description: '도시적인 로우 텍스처의 패브릭 프리미엄 합지입니다. 거친 도시의 감성을 담아낸 Raw Urban Touch 컨셉으로 모던하고 개성 있는 공간을 연출합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '어반 텍스처'], image: '/images/products/gaenari/trendy/28371-9.jpg' },
  { id: '1-new-37', productNo: '28372-1', name: '트랜디 Twisted Texture 화이트', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Twisted Texture', description: '독특한 트위스트 텍스처의 패브릭 프리미엄 합지입니다. 꼬임 구조의 독특한 직물 질감이 공간에 개성 있는 디자인을 더합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '트위스트 텍스처'], image: '/images/products/gaenari/trendy/28372-1.jpg' },
  { id: '1-new-38', productNo: '28372-2', name: '트랜디 Twisted Texture 아이보리', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Twisted Texture', description: '독특한 트위스트 텍스처의 패브릭 프리미엄 합지입니다. 꼬임 구조의 독특한 직물 질감이 공간에 개성 있는 디자인을 더합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '트위스트 텍스처'], image: '/images/products/gaenari/trendy/28372-2.jpg' },
  { id: '1-new-39', productNo: '28372-3', name: '트랜디 Twisted Texture 베이지', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Twisted Texture', description: '독특한 트위스트 텍스처의 패브릭 프리미엄 합지입니다. 꼬임 구조의 독특한 직물 질감이 공간에 개성 있는 디자인을 더합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '트위스트 텍스처'], image: '/images/products/gaenari/trendy/28372-3.jpg' },
  { id: '1-new-40', productNo: '28372-4', name: '트랜디 Twisted Texture 라이트그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Twisted Texture', description: '독특한 트위스트 텍스처의 패브릭 프리미엄 합지입니다. 꼬임 구조의 독특한 직물 질감이 공간에 개성 있는 디자인을 더합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '트위스트 텍스처'], image: '/images/products/gaenari/trendy/28372-4.jpg' },
  { id: '1-new-41', productNo: '28372-5', name: '트랜디 Twisted Texture 그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Twisted Texture', description: '독특한 트위스트 텍스처의 패브릭 프리미엄 합지입니다. 꼬임 구조의 독특한 직물 질감이 공간에 개성 있는 디자인을 더합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '트위스트 텍스처'], image: '/images/products/gaenari/trendy/28372-5.jpg' },
  { id: '1-new-42', productNo: '28372-6', name: '트랜디 Twisted Texture 딥그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Twisted Texture', description: '독특한 트위스트 텍스처의 패브릭 프리미엄 합지입니다. 꼬임 구조의 독특한 직물 질감이 공간에 개성 있는 디자인을 더합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '트위스트 텍스처'], image: '/images/products/gaenari/trendy/28372-6.jpg' },
  { id: '1-new-43', productNo: '28372-7', name: '트랜디 Twisted Texture 다크그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Twisted Texture', description: '독특한 트위스트 텍스처의 패브릭 프리미엄 합지입니다. 꼬임 구조의 독특한 직물 질감이 공간에 개성 있는 디자인을 더합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '트위스트 텍스처'], image: '/images/products/gaenari/trendy/28372-7.jpg' },
  { id: '1-new-44', productNo: '39369-1', name: '트랜디 39369 화이트', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: '39369', description: '프리미엄 합지 트랜디 제품입니다. 피톤치드 함유 및 수성잉크 인쇄로 친환경 인증을 받은 제품입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증'], image: '/images/products/gaenari/trendy/39369-1.jpg' },
  { id: '1-new-45', productNo: '39369-2', name: '트랜디 39369 아이보리', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: '39369', description: '프리미엄 합지 트랜디 제품입니다. 피톤치드 함유 및 수성잉크 인쇄로 친환경 인증을 받은 제품입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증'], image: '/images/products/gaenari/trendy/39369-2.jpg' },
  { id: '1-new-46', productNo: '39369-3', name: '트랜디 39369 베이지', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: '39369', description: '프리미엄 합지 트랜디 제품입니다. 피톤치드 함유 및 수성잉크 인쇄로 친환경 인증을 받은 제품입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증'], image: '/images/products/gaenari/trendy/39369-3.jpg' },
  { id: '1-new-47', productNo: '39369-5', name: '트랜디 39369 그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: '39369', description: '프리미엄 합지 트랜디 제품입니다. 피톤치드 함유 및 수성잉크 인쇄로 친환경 인증을 받은 제품입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증'], image: '/images/products/gaenari/trendy/39369-5.jpg' },
  { id: '1-new-48', productNo: '39371-1', name: '트랜디 Real Paint 화이트', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Real Paint', description: '자연의 흙과 돌에서 영감을 받은 리얼 페인트 프리미엄 합지입니다. Inspired by natural earth and stone. 자연 소재의 질감을 그대로 담아낸 페인트 효과 벽지입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '페인트 텍스처'], image: '/images/products/gaenari/trendy/39371-1.jpg' },
  { id: '1-new-49', productNo: '39371-2', name: '트랜디 Real Paint 아이보리', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Real Paint', description: '자연의 흙과 돌에서 영감을 받은 리얼 페인트 프리미엄 합지입니다. Inspired by natural earth and stone. 자연 소재의 질감을 그대로 담아낸 페인트 효과 벽지입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '페인트 텍스처'], image: '/images/products/gaenari/trendy/39371-2.jpg' },
  { id: '1-new-50', productNo: '39371-3', name: '트랜디 Real Paint 베이지', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Real Paint', description: '자연의 흙과 돌에서 영감을 받은 리얼 페인트 프리미엄 합지입니다. Inspired by natural earth and stone. 자연 소재의 질감을 그대로 담아낸 페인트 효과 벽지입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '페인트 텍스처'], image: '/images/products/gaenari/trendy/39371-3.jpg' },
  { id: '1-new-51', productNo: '39371-4', name: '트랜디 Real Paint 라이트그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Real Paint', description: '자연의 흙과 돌에서 영감을 받은 리얼 페인트 프리미엄 합지입니다. Inspired by natural earth and stone. 자연 소재의 질감을 그대로 담아낸 페인트 효과 벽지입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '페인트 텍스처'], image: '/images/products/gaenari/trendy/39371-4.jpg' },
  { id: '1-new-52', productNo: '39371-6', name: '트랜디 Real Paint 그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Real Paint', description: '자연의 흙과 돌에서 영감을 받은 리얼 페인트 프리미엄 합지입니다. Inspired by natural earth and stone. 자연 소재의 질감을 그대로 담아낸 페인트 효과 벽지입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '페인트 텍스처'], image: '/images/products/gaenari/trendy/39371-6.jpg' },
  { id: '1-new-53', productNo: '39371-7', name: '트랜디 Real Paint 딥그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Real Paint', description: '자연의 흙과 돌에서 영감을 받은 리얼 페인트 프리미엄 합지입니다. Inspired by natural earth and stone. 자연 소재의 질감을 그대로 담아낸 페인트 효과 벽지입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '페인트 텍스처'], image: '/images/products/gaenari/trendy/39371-7.jpg' },
  { id: '1-new-54', productNo: '39371-8', name: '트랜디 Real Paint 다크그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Real Paint', description: '자연의 흙과 돌에서 영감을 받은 리얼 페인트 프리미엄 합지입니다. Inspired by natural earth and stone. 자연 소재의 질감을 그대로 담아낸 페인트 효과 벽지입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '페인트 텍스처'], image: '/images/products/gaenari/trendy/39371-8.jpg' },
  { id: '1-new-55', productNo: '39371-9', name: '트랜디 Real Paint 블랙그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Real Paint', description: '자연의 흙과 돌에서 영감을 받은 리얼 페인트 프리미엄 합지입니다. Inspired by natural earth and stone. 자연 소재의 질감을 그대로 담아낸 페인트 효과 벽지입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '페인트 텍스처'], image: '/images/products/gaenari/trendy/39371-9.jpg' },
  { id: '1-new-56', productNo: '39372-1', name: '트랜디 Cozy Grey 라이트그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Cozy Grey', description: '포근한 그레이 톤의 프리미엄 합지입니다. Cozy Grey Hues 컨셉으로 따뜻하고 아늑한 그레이 색감이 공간에 편안한 분위기를 더합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증'], image: '/images/products/gaenari/trendy/39372-1.jpg' },
  { id: '1-new-57', productNo: '39372-2', name: '트랜디 Cozy Grey 그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Cozy Grey', description: '포근한 그레이 톤의 프리미엄 합지입니다. Cozy Grey Hues 컨셉으로 따뜻하고 아늑한 그레이 색감이 공간에 편안한 분위기를 더합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증'], image: '/images/products/gaenari/trendy/39372-2.jpg' },
  { id: '1-new-58', productNo: '39372-3', name: '트랜디 Cozy Grey 딥그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Cozy Grey', description: '포근한 그레이 톤의 프리미엄 합지입니다. Cozy Grey Hues 컨셉으로 따뜻하고 아늑한 그레이 색감이 공간에 편안한 분위기를 더합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증'], image: '/images/products/gaenari/trendy/39372-3.jpg' },
  { id: '1-new-59', productNo: '39374-1', name: '트랜디 Soft Light 화이트', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Soft Light', description: '부드러운 빛과 소프트한 질감의 프리미엄 합지입니다. Soft light. Softer walls. 빛처럼 부드러운 벽지로 공간에 은은한 아름다움을 더합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증'], image: '/images/products/gaenari/trendy/39374-1.jpg' },
  { id: '1-new-60', productNo: '39374-2', name: '트랜디 Soft Light 아이보리', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Soft Light', description: '부드러운 빛과 소프트한 질감의 프리미엄 합지입니다. Soft light. Softer walls. 빛처럼 부드러운 벽지로 공간에 은은한 아름다움을 더합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증'], image: '/images/products/gaenari/trendy/39374-2.jpg' },
  { id: '1-new-61', productNo: '39374-3', name: '트랜디 Soft Light 베이지', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Soft Light', description: '부드러운 빛과 소프트한 질감의 프리미엄 합지입니다. Soft light. Softer walls. 빛처럼 부드러운 벽지로 공간에 은은한 아름다움을 더합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증'], image: '/images/products/gaenari/trendy/39374-3.jpg' },
  { id: '1-new-62', productNo: '39374-4', name: '트랜디 Soft Light 라이트그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Soft Light', description: '부드러운 빛과 소프트한 질감의 프리미엄 합지입니다. Soft light. Softer walls. 빛처럼 부드러운 벽지로 공간에 은은한 아름다움을 더합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증'], image: '/images/products/gaenari/trendy/39374-4.jpg' },
  { id: '1-new-63', productNo: '39374-6', name: '트랜디 Soft Light 그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Soft Light', description: '부드러운 빛과 소프트한 질감의 프리미엄 합지입니다. Soft light. Softer walls. 빛처럼 부드러운 벽지로 공간에 은은한 아름다움을 더합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증'], image: '/images/products/gaenari/trendy/39374-6.jpg' },
  { id: '1-new-64', productNo: '39374-7', name: '트랜디 Soft Light 딥그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Soft Light', description: '부드러운 빛과 소프트한 질감의 프리미엄 합지입니다. Soft light. Softer walls. 빛처럼 부드러운 벽지로 공간에 은은한 아름다움을 더합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증'], image: '/images/products/gaenari/trendy/39374-7.jpg' },
  { id: '1-new-65', productNo: '39375-1', name: '트랜디 스타 패턴 골드', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: '스타 패턴', description: '아이 방에 어울리는 스타 패턴의 프리미엄 합지입니다. A Happy Little Room 컨셉으로 귀여운 별 패턴이 아이들의 공간에 밝고 활기찬 분위기를 더합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '키즈 패턴'], image: '/images/products/gaenari/trendy/39375-1.jpg' },
  { id: '1-new-66', productNo: '39375-2', name: '트랜디 스타 패턴 블루', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: '스타 패턴', description: '아이 방에 어울리는 스타 패턴의 프리미엄 합지입니다. A Happy Little Room 컨셉으로 귀여운 별 패턴이 아이들의 공간에 밝고 활기찬 분위기를 더합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '키즈 패턴'], image: '/images/products/gaenari/trendy/39375-2.jpg' },
  { id: '1-new-67', productNo: '39376-1', name: '트랜디 Cozy Stripe 화이트', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Cozy Stripe', description: '포근한 스트라이프 패턴의 프리미엄 합지입니다. Cozy Stripe 컨셉으로 따뜻하고 아늑한 줄무늬 패턴이 공간에 리듬감을 더합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '스트라이프 패턴'], image: '/images/products/gaenari/trendy/39376-1.jpg' },
  { id: '1-new-68', productNo: '39377-1', name: '트랜디 Cloud Marble 화이트', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Cloud Marble', description: '구름 마블 패턴의 우아한 프리미엄 합지입니다. 구름처럼 부드럽게 흐르는 마블 패턴이 공간에 고급스러운 분위기를 연출합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '마블 패턴'], image: '/images/products/gaenari/trendy/39377-1.jpg' },
  { id: '1-new-69', productNo: '39377-2', name: '트랜디 Cloud Marble 그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Cloud Marble', description: '구름 마블 패턴의 우아한 프리미엄 합지입니다. 구름처럼 부드럽게 흐르는 마블 패턴이 공간에 고급스러운 분위기를 연출합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '마블 패턴'], image: '/images/products/gaenari/trendy/39377-2.jpg' },
  { id: '1-new-70', productNo: '39378-1', name: '트랜디 Zen Fabric 화이트', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Zen Fabric', description: '선(禪)의 미학을 담은 패브릭 프리미엄 합지입니다. ZEN FABRIC 컨셉으로 동양의 고요하고 절제된 아름다움을 직물 질감으로 표현했습니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '젠 패브릭'], image: '/images/products/gaenari/trendy/39378-1.jpg' },
  { id: '1-new-71', productNo: '39378-2', name: '트랜디 Zen Fabric 베이지', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Zen Fabric', description: '선(禪)의 미학을 담은 패브릭 프리미엄 합지입니다. ZEN FABRIC 컨셉으로 동양의 고요하고 절제된 아름다움을 직물 질감으로 표현했습니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '젠 패브릭'], image: '/images/products/gaenari/trendy/39378-2.jpg' },
  { id: '1-new-72', productNo: '39379-1', name: '트랜디 Rugged Earth 베이지', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Rugged Earth', description: '거친 흙 질감의 자연스러운 프리미엄 합지입니다. Rugged Earth Texture 컨셉으로 대지의 거칠고 자연스러운 질감을 공간에 담아냈습니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '어스 텍스처'], image: '/images/products/gaenari/trendy/39379-1.jpg' },
  { id: '1-new-73', productNo: '39379-2', name: '트랜디 Rugged Earth 그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Rugged Earth', description: '거친 흙 질감의 자연스러운 프리미엄 합지입니다. Rugged Earth Texture 컨셉으로 대지의 거칠고 자연스러운 질감을 공간에 담아냈습니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '어스 텍스처'], image: '/images/products/gaenari/trendy/39379-2.jpg' },
  { id: '1-new-74', productNo: '39380-1', name: '트랜디 라인 회벽 화이트', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: '라인 회벽', description: '자연스럽게 이어붙인 듯한 세로 라인이 특징인 프리미엄 합지입니다. 회벽의 자연스러운 질감과 세로 라인 패턴이 공간에 독특한 개성을 더합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '라인 패턴'], image: '/images/products/gaenari/trendy/39380-1.jpg' },
  { id: '1-new-75', productNo: '39381-1', name: '트랜디 Real Travertine 화이트', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Real Travertine', description: '실제 트래버틴 대리석 질감의 프리미엄 합지입니다. Beyond Surface Beauty. 표면을 넘어선 아름다움으로 트래버틴 대리석의 자연스러운 패턴을 구현했습니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '트래버틴 텍스처'], image: '/images/products/gaenari/trendy/39381-1.jpg' },
  { id: '1-new-76', productNo: '39381-2', name: '트랜디 Real Travertine 베이지', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Real Travertine', description: '실제 트래버틴 대리석 질감의 프리미엄 합지입니다. Beyond Surface Beauty. 표면을 넘어선 아름다움으로 트래버틴 대리석의 자연스러운 패턴을 구현했습니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '트래버틴 텍스처'], image: '/images/products/gaenari/trendy/39381-2.jpg' },
  { id: '1-new-77', productNo: '39382-1', name: '트랜디 Ceramic Wall 화이트', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Ceramic Wall', description: '세라믹 벽 질감의 고요하고 우아한 프리미엄 합지입니다. Ceramic Wall Serenity 컨셉으로 세라믹의 매끄럽고 정제된 질감을 구현했습니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '세라믹 텍스처'], image: '/images/products/gaenari/trendy/39382-1.jpg' },
  { id: '1-new-78', productNo: '39382-2', name: '트랜디 Ceramic Wall 아이보리', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Ceramic Wall', description: '세라믹 벽 질감의 고요하고 우아한 프리미엄 합지입니다. Ceramic Wall Serenity 컨셉으로 세라믹의 매끄럽고 정제된 질감을 구현했습니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '세라믹 텍스처'], image: '/images/products/gaenari/trendy/39382-2.jpg' },
  { id: '1-new-79', productNo: '39382-3', name: '트랜디 Ceramic Wall 베이지', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Ceramic Wall', description: '세라믹 벽 질감의 고요하고 우아한 프리미엄 합지입니다. Ceramic Wall Serenity 컨셉으로 세라믹의 매끄럽고 정제된 질감을 구현했습니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '세라믹 텍스처'], image: '/images/products/gaenari/trendy/39382-3.jpg' },
  { id: '1-new-80', productNo: '39382-4', name: '트랜디 Ceramic Wall 라이트그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Ceramic Wall', description: '세라믹 벽 질감의 고요하고 우아한 프리미엄 합지입니다. Ceramic Wall Serenity 컨셉으로 세라믹의 매끄럽고 정제된 질감을 구현했습니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '세라믹 텍스처'], image: '/images/products/gaenari/trendy/39382-4.jpg' },
  { id: '1-new-81', productNo: '39382-5', name: '트랜디 Ceramic Wall 그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Ceramic Wall', description: '세라믹 벽 질감의 고요하고 우아한 프리미엄 합지입니다. Ceramic Wall Serenity 컨셉으로 세라믹의 매끄럽고 정제된 질감을 구현했습니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '세라믹 텍스처'], image: '/images/products/gaenari/trendy/39382-5.jpg' },
  { id: '1-new-82', productNo: '39383-1', name: '트랜디 39383 화이트', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: '39383', description: '프리미엄 합지 트랜디 제품입니다. 피톤치드 함유 및 수성잉크 인쇄로 친환경 인증을 받은 제품입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증'], image: '/images/products/gaenari/trendy/39383-1.jpg' },
  { id: '1-new-83', productNo: '39383-2', name: '트랜디 39383 아이보리', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: '39383', description: '프리미엄 합지 트랜디 제품입니다. 피톤치드 함유 및 수성잉크 인쇄로 친환경 인증을 받은 제품입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증'], image: '/images/products/gaenari/trendy/39383-2.jpg' },
  { id: '1-new-84', productNo: '39383-3', name: '트랜디 39383 베이지', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: '39383', description: '프리미엄 합지 트랜디 제품입니다. 피톤치드 함유 및 수성잉크 인쇄로 친환경 인증을 받은 제품입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증'], image: '/images/products/gaenari/trendy/39383-3.jpg' },
  { id: '1-new-85', productNo: '39383-4', name: '트랜디 39383 그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: '39383', description: '프리미엄 합지 트랜디 제품입니다. 피톤치드 함유 및 수성잉크 인쇄로 친환경 인증을 받은 제품입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증'], image: '/images/products/gaenari/trendy/39383-4.jpg' },
  { id: '1-new-86', productNo: '39383-5', name: '트랜디 39383 딥그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: '39383', description: '프리미엄 합지 트랜디 제품입니다. 피톤치드 함유 및 수성잉크 인쇄로 친환경 인증을 받은 제품입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증'], image: '/images/products/gaenari/trendy/39383-5.jpg' },
  { id: '1-new-87', productNo: '39384-1', name: '트랜디 39384 화이트', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: '39384', description: '프리미엄 합지 트랜디 제품입니다. 피톤치드 함유 및 수성잉크 인쇄로 친환경 인증을 받은 제품입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증'], image: '/images/products/gaenari/trendy/39384-1.jpg' },
  { id: '1-new-88', productNo: '39385-1', name: '트랜디 Luxe Fleece 화이트', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Luxe Fleece', description: '럭셔리 플리스 터치의 고급 패브릭 프리미엄 합지입니다. LUXE FLEECE TOUCH 컨셉으로 부드럽고 고급스러운 플리스 질감을 구현했습니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '플리스 텍스처'], image: '/images/products/gaenari/trendy/39385-1.jpg' },
  { id: '1-new-89', productNo: '39385-2', name: '트랜디 Luxe Fleece 아이보리', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Luxe Fleece', description: '럭셔리 플리스 터치의 고급 패브릭 프리미엄 합지입니다. LUXE FLEECE TOUCH 컨셉으로 부드럽고 고급스러운 플리스 질감을 구현했습니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '플리스 텍스처'], image: '/images/products/gaenari/trendy/39385-2.jpg' },
  { id: '1-new-90', productNo: '39385-3', name: '트랜디 Luxe Fleece 베이지', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Luxe Fleece', description: '럭셔리 플리스 터치의 고급 패브릭 프리미엄 합지입니다. LUXE FLEECE TOUCH 컨셉으로 부드럽고 고급스러운 플리스 질감을 구현했습니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '플리스 텍스처'], image: '/images/products/gaenari/trendy/39385-3.jpg' },
  { id: '1-new-91', productNo: '39385-4', name: '트랜디 Luxe Fleece 그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Luxe Fleece', description: '럭셔리 플리스 터치의 고급 패브릭 프리미엄 합지입니다. LUXE FLEECE TOUCH 컨셉으로 부드럽고 고급스러운 플리스 질감을 구현했습니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '플리스 텍스처'], image: '/images/products/gaenari/trendy/39385-4.jpg' },
  { id: '1-new-92', productNo: '39386-1', name: '트랜디 39386 화이트', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: '39386', description: '다채로운 컬러의 패브릭 프리미엄 합지입니다. 피톤치드 함유 및 수성잉크 인쇄로 친환경 인증을 받은 제품입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증'], image: '/images/products/gaenari/trendy/39386-1.jpg' },
  { id: '1-new-93', productNo: '39386-2', name: '트랜디 39386 아이보리', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: '39386', description: '다채로운 컬러의 패브릭 프리미엄 합지입니다. 피톤치드 함유 및 수성잉크 인쇄로 친환경 인증을 받은 제품입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증'], image: '/images/products/gaenari/trendy/39386-2.jpg' },
  { id: '1-new-94', productNo: '39386-3', name: '트랜디 39386 베이지', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: '39386', description: '다채로운 컬러의 패브릭 프리미엄 합지입니다. 피톤치드 함유 및 수성잉크 인쇄로 친환경 인증을 받은 제품입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증'], image: '/images/products/gaenari/trendy/39386-3.jpg' },
  { id: '1-new-95', productNo: '39386-4', name: '트랜디 39386 라이트그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: '39386', description: '다채로운 컬러의 패브릭 프리미엄 합지입니다. 피톤치드 함유 및 수성잉크 인쇄로 친환경 인증을 받은 제품입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증'], image: '/images/products/gaenari/trendy/39386-4.jpg' },
  { id: '1-new-96', productNo: '39386-5', name: '트랜디 39386 그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: '39386', description: '다채로운 컬러의 패브릭 프리미엄 합지입니다. 피톤치드 함유 및 수성잉크 인쇄로 친환경 인증을 받은 제품입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증'], image: '/images/products/gaenari/trendy/39386-5.jpg' },
  { id: '1-new-97', productNo: '39386-6', name: '트랜디 39386 딥그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: '39386', description: '다채로운 컬러의 패브릭 프리미엄 합지입니다. 피톤치드 함유 및 수성잉크 인쇄로 친환경 인증을 받은 제품입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증'], image: '/images/products/gaenari/trendy/39386-6.jpg' },
  { id: '1-new-98', productNo: '39387-1', name: '트랜디 Floral 화이트', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Floral', description: '우아한 플로럴 패턴의 프리미엄 합지입니다. 모든 코너에 속삭이는 꽃의 향기처럼 섬세한 꽃 패턴이 공간에 로맨틱한 분위기를 연출합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '플로럴 패턴'], image: '/images/products/gaenari/trendy/39387-1.jpg' },
  { id: '1-new-99', productNo: '39388-1', name: '트랜디 Forest Woodland 그린', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Forest Woodland', description: '자연 소재에서 영감을 받은 힐링 포레스트 패턴 프리미엄 합지입니다. 숲속의 치유 에너지를 담아 공간에 자연의 생기를 불어넣습니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '포레스트 패턴'], image: '/images/products/gaenari/trendy/39388-1.jpg' },
  { id: '1-new-100', productNo: '39388-2', name: '트랜디 Forest Woodland 베이지', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Forest Woodland', description: '자연 소재에서 영감을 받은 힐링 포레스트 패턴 프리미엄 합지입니다. 숲속의 치유 에너지를 담아 공간에 자연의 생기를 불어넣습니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '포레스트 패턴'], image: '/images/products/gaenari/trendy/39388-2.jpg' },
  { id: '1-new-101', productNo: '39389-1', name: '트랜디 Art Stucco 화이트', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Art Stucco', description: '예술적인 스투코 텍스처의 프리미엄 합지입니다. 질감이 살아있는 아트 스투코 패턴으로 공간에 예술적인 감성을 더합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '아트 스투코'], image: '/images/products/gaenari/trendy/39389-1.jpg' },
  { id: '1-new-102', productNo: '39389-2', name: '트랜디 Art Stucco 아이보리', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Art Stucco', description: '예술적인 스투코 텍스처의 프리미엄 합지입니다. 질감이 살아있는 아트 스투코 패턴으로 공간에 예술적인 감성을 더합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '아트 스투코'], image: '/images/products/gaenari/trendy/39389-2.jpg' },
  { id: '1-new-103', productNo: '39389-3', name: '트랜디 Art Stucco 그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Art Stucco', description: '예술적인 스투코 텍스처의 프리미엄 합지입니다. 질감이 살아있는 아트 스투코 패턴으로 공간에 예술적인 감성을 더합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '아트 스투코'], image: '/images/products/gaenari/trendy/39389-3.jpg' },
  { id: '1-new-104', productNo: '39390-1', name: '트랜디 Sand Plaster 화이트', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Sand Plaster', description: '모래 질감의 자연스러운 플라스터 프리미엄 합지입니다. 사막의 모래처럼 부드럽고 따뜻한 텍스처가 공간에 자연스러운 편안함을 더합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '플라스터 텍스처'], image: '/images/products/gaenari/trendy/39390-1.jpg' },
  { id: '1-new-105', productNo: '39390-2', name: '트랜디 Sand Plaster 아이보리', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Sand Plaster', description: '모래 질감의 자연스러운 플라스터 프리미엄 합지입니다. 사막의 모래처럼 부드럽고 따뜻한 텍스처가 공간에 자연스러운 편안함을 더합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '플라스터 텍스처'], image: '/images/products/gaenari/trendy/39390-2.jpg' },
  { id: '1-new-106', productNo: '39390-3', name: '트랜디 Sand Plaster 베이지', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Sand Plaster', description: '모래 질감의 자연스러운 플라스터 프리미엄 합지입니다. 사막의 모래처럼 부드럽고 따뜻한 텍스처가 공간에 자연스러운 편안함을 더합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '플라스터 텍스처'], image: '/images/products/gaenari/trendy/39390-3.jpg' },
  { id: '1-new-107', productNo: '39390-4', name: '트랜디 Sand Plaster 그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Sand Plaster', description: '모래 질감의 자연스러운 플라스터 프리미엄 합지입니다. 사막의 모래처럼 부드럽고 따뜻한 텍스처가 공간에 자연스러운 편안함을 더합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '플라스터 텍스처'], image: '/images/products/gaenari/trendy/39390-4.jpg' },
  { id: '1-new-108', productNo: '39391-1', name: '트랜디 European Stucco 화이트', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'European Stucco', description: '유럽풍 석고 질감의 깔끔하고 모던한 프리미엄 합지입니다. RAW ELEGANCE PLASTER 컨셉으로 거친 듯 우아한 스투코 텍스처를 구현했습니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '스투코 텍스처'], image: '/images/products/gaenari/trendy/39391-1.jpg' },
  { id: '1-new-109', productNo: '39391-2', name: '트랜디 European Stucco 아이보리', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'European Stucco', description: '유럽풍 석고 질감의 깔끔하고 모던한 프리미엄 합지입니다. RAW ELEGANCE PLASTER 컨셉으로 거친 듯 우아한 스투코 텍스처를 구현했습니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '스투코 텍스처'], image: '/images/products/gaenari/trendy/39391-2.jpg' },
  { id: '1-new-110', productNo: '39391-3', name: '트랜디 European Stucco 라이트그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'European Stucco', description: '유럽풍 석고 질감의 깔끔하고 모던한 프리미엄 합지입니다. RAW ELEGANCE PLASTER 컨셉으로 거친 듯 우아한 스투코 텍스처를 구현했습니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '스투코 텍스처'], image: '/images/products/gaenari/trendy/39391-3.jpg' },
  { id: '1-new-111', productNo: '39391-4', name: '트랜디 European Stucco 그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'European Stucco', description: '유럽풍 석고 질감의 깔끔하고 모던한 프리미엄 합지입니다. RAW ELEGANCE PLASTER 컨셉으로 거친 듯 우아한 스투코 텍스처를 구현했습니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '스투코 텍스처'], image: '/images/products/gaenari/trendy/39391-4.jpg' },
  { id: '1-new-112', productNo: '39391-5', name: '트랜디 European Stucco 딥그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'European Stucco', description: '유럽풍 석고 질감의 깔끔하고 모던한 프리미엄 합지입니다. RAW ELEGANCE PLASTER 컨셉으로 거친 듯 우아한 스투코 텍스처를 구현했습니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '스투코 텍스처'], image: '/images/products/gaenari/trendy/39391-5.jpg' },
  { id: '1-new-113', productNo: '39392-1', name: '트랜디 Silhouette Cotton 화이트', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Silhouette Cotton', description: '실루엣 패턴의 코튼 텍스처 프리미엄 합지입니다. 섬세한 실루엣 디자인이 공간에 세련된 분위기를 연출합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '코튼 텍스처'], image: '/images/products/gaenari/trendy/39392-1.jpg' },
  { id: '1-new-114', productNo: '39392-2', name: '트랜디 Silhouette Cotton 아이보리', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Silhouette Cotton', description: '실루엣 패턴의 코튼 텍스처 프리미엄 합지입니다. 섬세한 실루엣 디자인이 공간에 세련된 분위기를 연출합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '코튼 텍스처'], image: '/images/products/gaenari/trendy/39392-2.jpg' },
  { id: '1-new-115', productNo: '39392-3', name: '트랜디 Silhouette Cotton 베이지', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Silhouette Cotton', description: '실루엣 패턴의 코튼 텍스처 프리미엄 합지입니다. 섬세한 실루엣 디자인이 공간에 세련된 분위기를 연출합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '코튼 텍스처'], image: '/images/products/gaenari/trendy/39392-3.jpg' },
  { id: '1-new-116', productNo: '39392-4', name: '트랜디 Silhouette Cotton 라이트그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Silhouette Cotton', description: '실루엣 패턴의 코튼 텍스처 프리미엄 합지입니다. 섬세한 실루엣 디자인이 공간에 세련된 분위기를 연출합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '코튼 텍스처'], image: '/images/products/gaenari/trendy/39392-4.jpg' },
  { id: '1-new-117', productNo: '39392-5', name: '트랜디 Silhouette Cotton 바질그린', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Silhouette Cotton', description: '실루엣 패턴의 코튼 텍스처 프리미엄 합지입니다. 섬세한 실루엣 디자인이 공간에 세련된 분위기를 연출합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '코튼 텍스처'], image: '/images/products/gaenari/trendy/39392-5.jpg' },
  { id: '1-new-118', productNo: '39393-1', name: '트랜디 Eden Fabric 화이트', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Eden Fabric', description: '자연에서 영감을 받은 패브릭 텍스처의 프리미엄 합지입니다. 에덴의 풍요로운 자연을 담아낸 고급스러운 직물 질감으로 공간에 따뜻함을 더합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '패브릭 텍스처'], image: '/images/products/gaenari/trendy/39393-1.jpg' },
  { id: '1-new-119', productNo: '39393-2', name: '트랜디 Eden Fabric 아이보리', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Eden Fabric', description: '자연에서 영감을 받은 패브릭 텍스처의 프리미엄 합지입니다. 에덴의 풍요로운 자연을 담아낸 고급스러운 직물 질감으로 공간에 따뜻함을 더합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '패브릭 텍스처'], image: '/images/products/gaenari/trendy/39393-2.jpg' },
  { id: '1-new-120', productNo: '39393-3', name: '트랜디 Eden Fabric 베이지', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Eden Fabric', description: '자연에서 영감을 받은 패브릭 텍스처의 프리미엄 합지입니다. 에덴의 풍요로운 자연을 담아낸 고급스러운 직물 질감으로 공간에 따뜻함을 더합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '패브릭 텍스처'], image: '/images/products/gaenari/trendy/39393-3.jpg' },
  { id: '1-new-121', productNo: '39393-4', name: '트랜디 Eden Fabric 라이트그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Eden Fabric', description: '자연에서 영감을 받은 패브릭 텍스처의 프리미엄 합지입니다. 에덴의 풍요로운 자연을 담아낸 고급스러운 직물 질감으로 공간에 따뜻함을 더합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '패브릭 텍스처'], image: '/images/products/gaenari/trendy/39393-4.jpg' },
  { id: '1-new-122', productNo: '39393-5', name: '트랜디 Eden Fabric 밀드그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Eden Fabric', description: '자연에서 영감을 받은 패브릭 텍스처의 프리미엄 합지입니다. 에덴의 풍요로운 자연을 담아낸 고급스러운 직물 질감으로 공간에 따뜻함을 더합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '패브릭 텍스처'], image: '/images/products/gaenari/trendy/39393-5.jpg' },
  { id: '1-new-123', productNo: '39393-6', name: '트랜디 Eden Fabric 리얼그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Eden Fabric', description: '자연에서 영감을 받은 패브릭 텍스처의 프리미엄 합지입니다. 에덴의 풍요로운 자연을 담아낸 고급스러운 직물 질감으로 공간에 따뜻함을 더합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '패브릭 텍스처'], image: '/images/products/gaenari/trendy/39393-6.jpg' },
  { id: '1-new-124', productNo: '39393-7', name: '트랜디 Eden Fabric 딥그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Eden Fabric', description: '자연에서 영감을 받은 패브릭 텍스처의 프리미엄 합지입니다. 에덴의 풍요로운 자연을 담아낸 고급스러운 직물 질감으로 공간에 따뜻함을 더합니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '패브릭 텍스처'], image: '/images/products/gaenari/trendy/39393-7.jpg' },
  { id: '1-new-125', productNo: '39394-1', name: '트랜디 Bloom Cotton 화이트', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Bloom Cotton', description: '자연스러운 직물 질감으로 포근한 분위기를 연출하는 패브릭 계열 프리미엄 합지입니다. 피톤치드 함유 및 수성잉크 인쇄로 친환경 인증을 받은 제품입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '패브릭 텍스처'], image: '/images/products/gaenari/trendy/39394-1.jpg' },
  { id: '1-new-126', productNo: '39394-2', name: '트랜디 Bloom Cotton 아이보리', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Bloom Cotton', description: '자연스러운 직물 질감으로 포근한 분위기를 연출하는 패브릭 계열 프리미엄 합지입니다. 피톤치드 함유 및 수성잉크 인쇄로 친환경 인증을 받은 제품입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '패브릭 텍스처'], image: '/images/products/gaenari/trendy/39394-2.jpg' },
  { id: '1-new-127', productNo: '39394-3', name: '트랜디 Bloom Cotton 베이지', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Bloom Cotton', description: '자연스러운 직물 질감으로 포근한 분위기를 연출하는 패브릭 계열 프리미엄 합지입니다. 피톤치드 함유 및 수성잉크 인쇄로 친환경 인증을 받은 제품입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '패브릭 텍스처'], image: '/images/products/gaenari/trendy/39394-3.jpg' },
  { id: '1-new-128', productNo: '39394-4', name: '트랜디 Bloom Cotton 라이트그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Bloom Cotton', description: '자연스러운 직물 질감으로 포근한 분위기를 연출하는 패브릭 계열 프리미엄 합지입니다. 피톤치드 함유 및 수성잉크 인쇄로 친환경 인증을 받은 제품입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '패브릭 텍스처'], image: '/images/products/gaenari/trendy/39394-4.jpg' },
  { id: '1-new-129', productNo: '39394-5', name: '트랜디 Bloom Cotton 그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Bloom Cotton', description: '자연스러운 직물 질감으로 포근한 분위기를 연출하는 패브릭 계열 프리미엄 합지입니다. 피톤치드 함유 및 수성잉크 인쇄로 친환경 인증을 받은 제품입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '패브릭 텍스처'], image: '/images/products/gaenari/trendy/39394-5.jpg' },
  { id: '1-new-130', productNo: '39394-6', name: '트랜디 Bloom Cotton 딥그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: 'Bloom Cotton', description: '자연스러운 직물 질감으로 포근한 분위기를 연출하는 패브릭 계열 프리미엄 합지입니다. 피톤치드 함유 및 수성잉크 인쇄로 친환경 인증을 받은 제품입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '패브릭 텍스처'], image: '/images/products/gaenari/trendy/39394-6.jpg' },
  { id: '1-new-131', productNo: '64014-1', name: '트랜디 타일 벽지 화이트모자이크', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: '타일 벽지', description: '타일 패턴의 프리미엄 합지입니다. 주방, 욕실 등에 타일 시공 없이도 타일 느낌을 연출할 수 있는 모자이크 타일 패턴 벽지입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '타일 패턴'], image: '/images/products/gaenari/trendy/64014-1.jpg' },
  { id: '1-new-132', productNo: '64014-2', name: '트랜디 타일 벽지 그린모자이크', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: '타일 벽지', description: '타일 패턴의 프리미엄 합지입니다. 주방, 욕실 등에 타일 시공 없이도 타일 느낌을 연출할 수 있는 모자이크 타일 패턴 벽지입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '타일 패턴'], image: '/images/products/gaenari/trendy/64014-2.jpg' },
  { id: '1-new-133', productNo: '64022-1', name: '트랜디 타일 벽지 화이트', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: '타일 벽지', description: '타일 패턴의 프리미엄 합지입니다. 주방, 욕실 등에 타일 시공 없이도 타일 느낌을 연출할 수 있는 직사각 타일 패턴 벽지입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '타일 패턴'], image: '/images/products/gaenari/trendy/64022-1.jpg' },
  { id: '1-new-134', productNo: '64023-1', name: '트랜디 타일 벽지 그레이', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: '타일 벽지', description: '타일 패턴의 프리미엄 합지입니다. 주방, 욕실 등에 타일 시공 없이도 타일 느낌을 연출할 수 있는 벽돌 타일 패턴 벽지입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '타일 패턴'], image: '/images/products/gaenari/trendy/64023-1.jpg' },
  { id: '1-new-135', productNo: '64024-1', name: '트랜디 타일 벽지 화이트', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: '타일 벽지', description: '타일 패턴의 프리미엄 합지입니다. 주방, 욕실 등에 타일 시공 없이도 타일 느낌을 연출할 수 있는 정사각 타일 패턴 벽지입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '타일 패턴'], image: '/images/products/gaenari/trendy/64024-1.jpg' },
  { id: '1-new-136', productNo: '64024-2', name: '트랜디 타일 벽지 아이보리', brand: '개나리', line: '트랜디', materialType: '합지', collectionName: '타일 벽지', description: '타일 패턴의 프리미엄 합지입니다. 주방, 욕실 등에 타일 시공 없이도 타일 느낌을 연출할 수 있는 정사각 타일 패턴 벽지입니다.', specs: ['합지', '광폭', '피톤치드 함유', '수성잉크', '항균코팅', '친환경 인증', '타일 패턴'], image: '/images/products/gaenari/trendy/64024-2.jpg' },
    // --- PRIMO 컬렉션 (유러피안 최고급 실크 벽지) ---
    { id: '1-1', productNo: '92102-1', name: '프리모 크랙 화이트', brand: '개나리', line: '프리모', specs: ['부직포', '방염', '크랙 텍스처'], image: '/images/wallpaper/92102-1.jpg' },
    { id: '1-2', productNo: '92102-2', name: '프리모 크랙 아이보리', brand: '개나리', line: '프리모', specs: ['부직포', '방염', '크랙 텍스처'], image: '/images/wallpaper/92102-2.jpg' },
    { id: '1-3', productNo: '92101-1', name: '프리모 회벽 화이트', brand: '개나리', line: '프리모', specs: ['부직포', '방염', '리얼 회벽 텍스처'], image: '/images/wallpaper/92101-1.jpg' },
    { id: '1-4', productNo: '92101-2', name: '프리모 회벽 그레이', brand: '개나리', line: '프리모', specs: ['부직포', '방염', '리얼 회벽 텍스처'], image: '/images/wallpaper/92101-2.jpg' },
    // --- Plaster & Paint 컬렉션 ---
    { id: '1-5', productNo: '91205-1', name: '플라스터 내추럴 화이트', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '내추럴 소재 텍스처'], image: '/images/wallpaper/91205-1.jpg' },
    { id: '1-6', productNo: '91205-2', name: '플라스터 내추럴 베이지', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '내추럴 소재 텍스처'], image: '/images/wallpaper/91205-2.jpg' },
    { id: '1-7', productNo: '91205-3', name: '플라스터 내추럴 그레이', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '내추럴 소재 텍스처'], image: '/images/wallpaper/91205-3.jpg' },
    { id: '1-8', productNo: '91205-4', name: '플라스터 내추럴 다크', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '내추럴 소재 텍스처'], image: '/images/wallpaper/91205-4.jpg' },
    { id: '1-9', productNo: '91204-1', name: '플라스터 우드 화이트', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '우드/대리석 텍스처'], image: '/images/wallpaper/91204-1.jpg' },
    { id: '1-10', productNo: '91204-2', name: '플라스터 우드 베이지', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '우드/대리석 텍스처'], image: '/images/wallpaper/91204-2.jpg' },
    { id: '1-11', productNo: '91204-3', name: '플라스터 우드 그레이', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '우드/대리석 텍스처'], image: '/images/wallpaper/91204-3.jpg' },
    { id: '1-12', productNo: '91193-1', name: '플라스터 스톤 화이트', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '스톤 텍스처'], image: '/images/wallpaper/91193-1.jpg' },
    { id: '1-13', productNo: '91193-2', name: '플라스터 스톤 베이지', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '스톤 텍스처'], image: '/images/wallpaper/91193-2.jpg' },
    { id: '1-14', productNo: '91193-3', name: '플라스터 스톤 그레이', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '스톤 텍스처'], image: '/images/wallpaper/91193-3.jpg' },
    { id: '1-15', productNo: '91203-1', name: '플라스터 딥터치 화이트', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '딥터치 텍스처'], image: '/images/wallpaper/91203-1.jpg' },
    { id: '1-16', productNo: '91203-2', name: '플라스터 딥터치 아이보리', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '딥터치 텍스처'], image: '/images/wallpaper/91203-2.jpg' },
    { id: '1-17', productNo: '91203-3', name: '플라스터 딥터치 그레이', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '딥터치 텍스처'], image: '/images/wallpaper/91203-3.jpg' },
    { id: '1-18', productNo: '91203-4', name: '플라스터 딥터치 다크', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '딥터치 텍스처'], image: '/images/wallpaper/91203-4.jpg' },
    { id: '1-19', productNo: '91202-1', name: '리얼페인트 화이트', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '페인트 질감'], image: '/images/wallpaper/91202-1.jpg' },
    { id: '1-20', productNo: '91202-2', name: '리얼페인트 아이보리', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '페인트 질감'], image: '/images/wallpaper/91202-2.jpg' },
    { id: '1-21', productNo: '91202-3', name: '리얼페인트 그레이', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '페인트 질감'], image: '/images/wallpaper/91202-3.jpg' },
    { id: '1-22', productNo: '91201-1', name: '리얼페인트 플레인 화이트', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '균일한 질감'], image: '/images/wallpaper/91201-1.jpg' },
    { id: '1-23', productNo: '91201-2', name: '리얼페인트 플레인 아이보리', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '균일한 질감'], image: '/images/wallpaper/91201-2.jpg' },
    { id: '1-24', productNo: '91201-3', name: '리얼페인트 플레인 그레이', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '균일한 질감'], image: '/images/wallpaper/91201-3.jpg' },
    { id: '1-25', productNo: '91190-1', name: '리얼페인트 라이트 화이트', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '라이트 텍스처'], image: '/images/wallpaper/91190-1.jpg' },
    { id: '1-26', productNo: '91190-2', name: '리얼페인트 라이트 아이보리', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '라이트 텍스처'], image: '/images/wallpaper/91190-2.jpg' },
    { id: '1-27', productNo: '90138-1', name: '리얼페인트 베이직', brand: '개나리', line: 'Plaster&Paint', specs: ['방염', '베이직 텍스처'], image: '/images/wallpaper/90138-1.jpg' },
    // --- Simple Fabric 컬렉션 ---
    { id: '1-28', productNo: '91200-1', name: '심플패브릭 리넨 화이트', brand: '개나리', line: 'Simple Fabric', specs: ['방염', '리넨 텍스처'], image: '/images/wallpaper/91200-1.jpg' },
    { id: '1-29', productNo: '91200-2', name: '심플패브릭 리넨 아이보리', brand: '개나리', line: 'Simple Fabric', specs: ['방염', '리넨 텍스처'], image: '/images/wallpaper/91200-2.jpg' },
    { id: '1-30', productNo: '91200-3', name: '심플패브릭 리넨 그레이', brand: '개나리', line: 'Simple Fabric', specs: ['방염', '리넨 텍스처'], image: '/images/wallpaper/91200-3.jpg' },
    { id: '1-31', productNo: '91199-1', name: '심플패브릭 소프트 화이트', brand: '개나리', line: 'Simple Fabric', specs: ['방염', '소프트 텍스처'], image: '/images/wallpaper/91199-1.jpg' },
    { id: '1-32', productNo: '91199-2', name: '심플패브릭 소프트 아이보리', brand: '개나리', line: 'Simple Fabric', specs: ['방염', '소프트 텍스처'], image: '/images/wallpaper/91199-2.jpg' },
    { id: '1-33', productNo: '91199-3', name: '심플패브릭 소프트 그레이', brand: '개나리', line: 'Simple Fabric', specs: ['방염', '소프트 텍스처'], image: '/images/wallpaper/91199-3.jpg' },
    { id: '1-34', productNo: '91198-1', name: '심플패브릭 믹스 화이트', brand: '개나리', line: 'Simple Fabric', specs: ['방염', '믹스 텍스처'], image: '/images/wallpaper/91198-1.jpg' },
    { id: '1-35', productNo: '91198-2', name: '심플패브릭 믹스 아이보리', brand: '개나리', line: 'Simple Fabric', specs: ['방염', '믹스 텍스처'], image: '/images/wallpaper/91198-2.jpg' },
    { id: '1-36', productNo: '91198-3', name: '심플패브릭 믹스 그레이', brand: '개나리', line: 'Simple Fabric', specs: ['방염', '믹스 텍스처'], image: '/images/wallpaper/91198-3.jpg' },
    { id: '1-37', productNo: '91198-4', name: '심플패브릭 믹스 베이지', brand: '개나리', line: 'Simple Fabric', specs: ['방염', '믹스 텍스처'], image: '/images/wallpaper/91198-4.jpg' },
    { id: '1-38', productNo: '91198-5', name: '심플패브릭 믹스 다크', brand: '개나리', line: 'Simple Fabric', specs: ['방염', '믹스 텍스처'], image: '/images/wallpaper/91198-5.jpg' },
    // --- Urban Fabric 컬렉션 ---
    { id: '1-39', productNo: '91187-1', name: '어반패브릭 화이트', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '어반 패브릭 텍스처'], image: '/images/wallpaper/91187-1.jpg' },
    { id: '1-40', productNo: '91187-2', name: '어반패브릭 아이보리', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '어반 패브릭 텍스처'], image: '/images/wallpaper/91187-2.jpg' },
    { id: '1-41', productNo: '91187-4', name: '어반패브릭 라이트 그레이', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '어반 패브릭 텍스처'], image: '/images/wallpaper/91187-4.jpg' },
    { id: '1-42', productNo: '91187-5', name: '어반패브릭 블루 그레이', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '어반 패브릭 텍스처'], image: '/images/wallpaper/91187-5.jpg' },
    { id: '1-43', productNo: '91051-1', name: '어반패브릭 크림', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '크림 패브릭 텍스처'], image: '/images/wallpaper/91051-1.jpg' },
    { id: '1-44', productNo: '90142-1', name: '어반패브릭 플레인 화이트', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '플레인 패브릭'], image: '/images/wallpaper/90142-1.jpg' },
    { id: '1-45', productNo: '90142-2', name: '어반패브릭 플레인 그레이', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '플레인 패브릭'], image: '/images/wallpaper/90142-2.jpg' },
    { id: '1-46', productNo: '90142-3', name: '어반패브릭 플레인 베이지', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '플레인 패브릭'], image: '/images/wallpaper/90142-3.jpg' },
    { id: '1-47', productNo: '91186-1', name: '터치패브릭 화이트', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '패브릭 터치'], image: '/images/wallpaper/91186-1.jpg' },
    { id: '1-48', productNo: '91186-3', name: '터치패브릭 아이보리', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '패브릭 터치'], image: '/images/wallpaper/91186-3.jpg' },
    { id: '1-49', productNo: '90141-1', name: '터치패브릭 소프트 화이트', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '소프트 패브릭'], image: '/images/wallpaper/90141-1.jpg' },
    { id: '1-50', productNo: '90141-2', name: '터치패브릭 소프트 아이보리', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '소프트 패브릭'], image: '/images/wallpaper/90141-2.jpg' },
    { id: '1-51', productNo: '91180-1', name: '어반 체크 화이트', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '체크 패브릭'], image: '/images/wallpaper/91180-1.jpg' },
    { id: '1-52', productNo: '91180-4', name: '어반 체크 아이보리', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '체크 패브릭'], image: '/images/wallpaper/91180-4.jpg' },
    { id: '1-53', productNo: '91197-1', name: '어반 패턴 화이트', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '패턴 패브릭'], image: '/images/wallpaper/91197-1.jpg' },
    { id: '1-54', productNo: '91197-2', name: '어반 패턴 아이보리', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '패턴 패브릭'], image: '/images/wallpaper/91197-2.jpg' },
    { id: '1-55', productNo: '91197-3', name: '어반 패턴 그레이', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '패턴 패브릭'], image: '/images/wallpaper/91197-3.jpg' },
    { id: '1-56', productNo: '91197-4', name: '어반 패턴 다크', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '패턴 패브릭'], image: '/images/wallpaper/91197-4.jpg' },
    { id: '1-57', productNo: '91196-1', name: '어반 플레인 화이트', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '플레인 텍스처'], image: '/images/wallpaper/91196-1.jpg' },
    { id: '1-58', productNo: '91196-2', name: '어반 플레인 아이보리', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '플레인 텍스처'], image: '/images/wallpaper/91196-2.jpg' },
    { id: '1-59', productNo: '91196-3', name: '어반 플레인 그레이', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '플레인 텍스처'], image: '/images/wallpaper/91196-3.jpg' },
    { id: '1-60', productNo: '91185-1', name: '어반 스트라이프 화이트', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '스트라이프 텍스처'], image: '/images/wallpaper/91185-1.jpg' },
    { id: '1-61', productNo: '91185-2', name: '어반 스트라이프 베이지', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '스트라이프 텍스처'], image: '/images/wallpaper/91185-2.jpg' },
    { id: '1-62', productNo: '91185-4', name: '어반 스트라이프 블루', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '스트라이프 텍스처'], image: '/images/wallpaper/91185-4.jpg' },
    { id: '1-63', productNo: '91194-1', name: '어반 라인 화이트', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '라인 텍스처'], image: '/images/wallpaper/91194-1.jpg' },
    { id: '1-64', productNo: '91194-2', name: '어반 라인 그레이', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '라인 텍스처'], image: '/images/wallpaper/91194-2.jpg' },
    { id: '1-65', productNo: '91182-1', name: '어반 믹스 화이트', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '믹스 텍스처'], image: '/images/wallpaper/91182-1.jpg' },
    { id: '1-66', productNo: '91182-2', name: '어반 믹스 핑크', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '믹스 텍스처'], image: '/images/wallpaper/91182-2.jpg' },
    { id: '1-67', productNo: '91182-3', name: '어반 믹스 베이지', brand: '개나리', line: 'Urban Fabric', specs: ['방염', '믹스 텍스처'], image: '/images/wallpaper/91182-3.jpg' },
    // --- Kids 컬렉션 ---
    { id: '1-68', productNo: '91181-2', name: '키즈 옐로우', brand: '개나리', line: 'Kids', specs: ['방염', '유독가스 억제', '키즈 전용'], image: '/images/wallpaper/91181-2.jpg' },
    { id: '1-69', productNo: '90139-1', name: '키즈 핑크', brand: '개나리', line: 'Kids', specs: ['방염', '유독가스 억제', '키즈 전용'], image: '/images/wallpaper/90139-1.jpg' },
    { id: '1-70', productNo: '90139-3', name: '키즈 민트', brand: '개나리', line: 'Kids', specs: ['방염', '유독가스 억제', '키즈 전용'], image: '/images/wallpaper/90139-3.jpg' },
    { id: '1-71', productNo: '90139-4', name: '키즈 라임', brand: '개나리', line: 'Kids', specs: ['방염', '유독가스 억제', '키즈 전용'], image: '/images/wallpaper/90139-4.jpg' },
    // --- Ceiling 컬렉션 ---
    { id: '1-72', productNo: '90013-1', name: '천장 텍스처 화이트', brand: '개나리', line: 'Ceiling', specs: ['방염', '천장 전용'], image: '/images/wallpaper/90013-1.jpg' },
    { id: '1-73', productNo: '90170-1', name: '천장 스무스 화이트', brand: '개나리', line: 'Ceiling', specs: ['방염', '천장 전용'], image: '/images/wallpaper/90170-1.jpg' },
    { id: '1-74', productNo: '90170-2', name: '천장 스무스 아이보리', brand: '개나리', line: 'Ceiling', specs: ['방염', '천장 전용'], image: '/images/wallpaper/90170-2.jpg' },
    { id: '1-75', productNo: '90160-1', name: '천장 플레인 화이트', brand: '개나리', line: 'Ceiling', specs: ['방염', '천장 전용'], image: '/images/wallpaper/90160-1.jpg' },
    { id: '1-76', productNo: '90160-2', name: '천장 플레인 아이보리', brand: '개나리', line: 'Ceiling', specs: ['방염', '천장 전용'], image: '/images/wallpaper/90160-2.jpg' },
    { id: '1-77', productNo: '91054-1', name: '천장 프리미엄 화이트', brand: '개나리', line: 'Ceiling', specs: ['방염', '천장 전용', '프리미엄'], image: '/images/wallpaper/91054-1.jpg' },
  ],
  2: [
    { id: '2-1', productNo: '82102-1', name: '세라믹 타일', brand: '세라믹', line: '클래식', specs: ['300x300', '광택'], image: 'https://via.placeholder.com/400x400?text=Tile+1' },
  ],
  3: [
    { id: '3-1', productNo: '72102-1', name: '3M 데코 필름', brand: '3M', line: '프리미엄', specs: ['투명', '방수'], image: 'https://via.placeholder.com/400x400?text=Film+1' },
  ],
  4: [
    { id: '4-1', productNo: '62102-1', name: '럭셔리 장판', brand: '럭셔리', line: '프리미엄', specs: ['방음', '내구성'], image: 'https://via.placeholder.com/400x400?text=Flooring+1' },
  ],
  5: [
    { id: '5-1', productNo: '52102-1', name: '오크 마루', brand: '오크', line: '내추럴', specs: ['천연 목재', '고급 마감'], image: 'https://via.placeholder.com/400x400?text=Wood+1' },
  ],
  6: [
    { id: '6-1', productNo: '42102-1', name: '에폭시 줄눈', brand: '에폭시', line: '화이트', specs: ['방수', '내구성'], image: 'https://via.placeholder.com/400x400?text=Grout+1' },
  ],
  7: [
    { id: '7-1', productNo: '32102-1', name: '우레탄 코트', brand: '우레탄', line: '광택', specs: ['고광택', '내구성'], image: 'https://via.placeholder.com/400x400?text=Coat+1' },
  ],
};

// 정렬 타입
type SortKey = 'name' | 'productNo' | 'default';
type SortOrder = 'asc' | 'desc';

interface SortState {
  key: SortKey;
  order: SortOrder;
}

// 정렬 헬퍼 함수
function sortProducts<T extends { name: string; productNo: string }>(products: T[], sort: SortState): T[] {
  if (sort.key === 'default') return products;
  return [...products].sort((a, b) => {
    const valA = sort.key === 'name' ? a.name : a.productNo;
    const valB = sort.key === 'name' ? b.name : b.productNo;
    const cmp = valA.localeCompare(valB, 'ko');
    return sort.order === 'asc' ? cmp : -cmp;
  });
}

// 프로젝트 타입
interface Project {
  id: string;
  name: string;
  selectedProducts: string[];
  likedProducts: string[];
  productNotes: Record<string, { location: string; memo: string }>;
  createdAt: number;
}

// 카테고리 네비게이션 컴포넌트
function CategoryNavigation({
  selectedCategory,
  selectedBrand,
  selectedMaterialType,
  selectedGroup,
  selectedLine,
  expandedCategory,
  expandedBrand,
  expandedMaterialType,
  expandedGroup,
  onCategoryClick,
  onBrandClick,
  onMaterialTypeClick,
  onGroupClick,
  onLineClick,
}: {
  selectedCategory: number;
  selectedBrand: string | null;
  selectedMaterialType: string | null;
  selectedGroup: string | null;
  selectedLine: string | null;
  expandedCategory: number | null;
  expandedBrand: string | null;
  expandedMaterialType: string | null;
  expandedGroup: string | null;
  onCategoryClick: (id: number) => void;
  onBrandClick: (brand: string) => void;
  onMaterialTypeClick: (mt: string) => void;
  onGroupClick: (group: string) => void;
  onLineClick: (line: string) => void;
}) {
  const { sidebarOpen } = useSidebar();

  if (!sidebarOpen) {
    // 접힌 상태: 텍스트만 표시
    return (
      <div className="flex flex-col h-full">
        <div className="space-y-2 px-2 scrollbar-hide overflow-y-auto flex-1">
          <SidebarNav>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onCategoryClick(cat.id)}
                className={cn(
                  'w-full py-2 px-2 rounded-md flex items-center justify-center transition-all duration-200 border-2 font-semibold text-xs text-center',
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white border-blue-700 shadow-lg hover:bg-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-400'
                )}
                title={cat.name}
              >
                <span className="line-clamp-2">{cat.name}</span>
              </button>
            ))}
          </SidebarNav>
        </div>

      </div>
    );
  }

  // 펼친 상태: 전체 메뉴 표시
  return (
    <div className="space-y-2 px-2 scrollbar-hide overflow-y-auto">
      <SidebarNav>
        {CATEGORIES.map((cat) => (
          <div key={cat.id}>
            <button
              onClick={() => onCategoryClick(cat.id)}
              className={cn(
                'w-full py-2 px-3 rounded-md flex items-center justify-between transition-all duration-200 border-2 font-semibold text-sm',
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white border-blue-700 shadow-lg hover:bg-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-400'
              )}
            >
              <span>{cat.name}</span>
              {expandedCategory === cat.id ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {/* 브랜드 목록 */}
            {expandedCategory === cat.id && (
              <div className="ml-2 mt-1 space-y-1">
                {cat.brands.map((brand) => (
                  <div key={brand.name}>
                    <button
                      onClick={() => onBrandClick(brand.name)}
                      className={cn(
                        'w-full py-1 px-3 rounded text-sm flex items-center justify-between transition-colors',
                        selectedBrand === brand.name
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      <span>{brand.name}</span>
                      {expandedBrand === `${cat.id}:${brand.name}` ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </button>

                    {/* 소재 유형 목록 (실크/합지 등) */}
                    {expandedBrand === `${cat.id}:${brand.name}` && (
                      <div className="ml-2 mt-1 space-y-1">
                        {(brand.materialTypes ?? []).map((mt) => (
                          <div key={mt.name}>
                            <button
                              onClick={() => onMaterialTypeClick(mt.name)}
                              className={cn(
                                'w-full py-1 px-3 rounded text-xs flex items-center justify-between transition-colors',
                                selectedMaterialType === mt.name
                                  ? 'bg-violet-100 text-violet-700 font-medium'
                                  : 'text-gray-500 hover:bg-gray-100'
                              )}
                            >
                              <span>{mt.name}</span>
                              {expandedMaterialType === `${brand.name}:${mt.name}` ? (
                                <ChevronDown className="w-3 h-3" />
                              ) : (
                                <ChevronRight className="w-3 h-3" />
                              )}
                            </button>
                            {/* 제품군 목록 */}
                            {expandedMaterialType === `${brand.name}:${mt.name}` && (
                              <div className="ml-2 mt-1 space-y-1">
                                {mt.groups.map((group) => (
                                  <div key={group.name}>
                                    <button
                                      onClick={() => onGroupClick(group.name)}
                                      className={cn(
                                        'w-full py-1 px-3 rounded text-xs flex items-center justify-between transition-colors',
                                        selectedGroup === group.name
                                          ? 'bg-indigo-100 text-indigo-700 font-medium'
                                          : 'text-gray-500 hover:bg-gray-100'
                                      )}
                                    >
                                      <span>{group.name}</span>
                                      {expandedGroup === group.name ? (
                                        <ChevronDown className="w-3 h-3" />
                                      ) : (
                                        <ChevronRight className="w-3 h-3" />
                                      )}
                                    </button>
                                    {/* 제품라인 목록 */}
                                    {expandedGroup === group.name && (
                                      <div className="ml-2 mt-1 space-y-1">
                                        {group.lines.map((line) => (
                                          <button
                                            key={line}
                                            onClick={() => onLineClick(line)}
                                            className={cn(
                                              'w-full py-1 px-3 rounded text-xs transition-colors',
                                              selectedLine === line
                                                ? 'bg-blue-200 text-blue-800 font-medium'
                                                : 'text-gray-400 hover:bg-gray-100'
                                            )}
                                          >
                                            {line}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </SidebarNav>
    </div>
  );
}

export default function EbookViewer() {
  const [, navigate] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState(1);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<number | null>(1);
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null);
  const [selectedMaterialType, setSelectedMaterialType] = useState<string | null>(null);
  const [expandedMaterialType, setExpandedMaterialType] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'browse' | 'selected' | 'liked'>('browse');
  const [projectName, setProjectName] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<string>('');
  const [newProjectName, setNewProjectName] = useState('');
  const [productNotes, setProductNotes] = useState<Record<string, { location: string; memo: string }>>({});
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | null>(null);
  const [likedCategoryFilter, setLikedCategoryFilter] = useState<number | null>(null);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>('');

  // 정렬 상태
  const [browseSort, setBrowseSort] = useState<SortState>({ key: 'default', order: 'asc' });
  const [selectedSort, setSelectedSort] = useState<SortState>({ key: 'default', order: 'asc' });
  const [likedSort, setLikedSort] = useState<SortState>({ key: 'default', order: 'asc' });

  // 프로젝트 로드
  useEffect(() => {
    const saved = localStorage.getItem('projects');
    if (saved) {
      setProjects(JSON.parse(saved));
    }
    const current = localStorage.getItem('currentProject');
    if (current) {
      setCurrentProject(current);
    }
  }, []);

  const currentCategory = CATEGORIES.find((c) => c.id === selectedCategory);
  const samples = MOCK_SAMPLES[selectedCategory as keyof typeof MOCK_SAMPLES] || [];
  
  // 선택된 그룹에 속하는 라인 목록 계산 (5단계: materialType 경유)
  const currentGroupLines: string[] = (() => {
    if (!selectedGroup) return [];
    const brand = currentCategory?.brands.find((b) => b.name === selectedBrand);
    const mts = (brand as any)?.materialTypes ?? [];
    // materialType이 선택된 경우 해당 materialType 내에서 그룹 탐색
    if (selectedMaterialType) {
      const mt = mts.find((m: any) => m.name === selectedMaterialType);
      const group = mt?.groups.find((g: any) => g.name === selectedGroup);
      return group?.lines ?? [];
    }
    // materialType 미선택 시 전체 materialTypes에서 탐색
    for (const mt of mts) {
      const group = mt.groups?.find((g: any) => g.name === selectedGroup);
      if (group) return group.lines ?? [];
    }
    return [];
  })();

  const filteredSamples = sortProducts(
    samples.filter((s) => {
      if (selectedBrand && s.brand !== selectedBrand) return false;
      // materialType 필터 (실크/합지 등) — sample에 materialType 필드가 있는 경우
      if (selectedMaterialType && (s as any).materialType && (s as any).materialType !== selectedMaterialType) return false;
      // 그룹이 선택된 경우: 해당 그룹의 라인 목록으로 필터
      if (selectedGroup && currentGroupLines.length > 0 && !currentGroupLines.includes(s.line)) return false;
      if (selectedLine && s.line !== selectedLine) return false;
      if (searchQuery && !s.productNo.includes(searchQuery) && !s.name.includes(searchQuery)) return false;
      return true;
    }),
    browseSort
  );

  const toggleProductSelection = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const toggleProductLike = (productId: string) => {
    const newLiked = new Set(likedProducts);
    if (newLiked.has(productId)) {
      newLiked.delete(productId);
    } else {
      newLiked.add(productId);
    }
    setLikedProducts(newLiked);
  };

  const getSelectedProductDetails = () => {
    const allSamples = Object.values(MOCK_SAMPLES).flat();
    let filtered = allSamples.filter((s) => selectedProducts.has(s.id));
    if (selectedCategoryFilter) {
      const category = CATEGORIES.find(c => c.id === selectedCategoryFilter);
      if (category) {
        const brandNames = category.brands.map(b => b.name);
        filtered = filtered.filter(s => brandNames.includes(s.brand));
      }
    }
    return sortProducts(filtered, selectedSort);
  };

  const getLikedProductDetails = () => {
    const allSamples = Object.values(MOCK_SAMPLES).flat();
    let filtered = allSamples.filter((s) => likedProducts.has(s.id));
    if (likedCategoryFilter) {
      const category = CATEGORIES.find(c => c.id === likedCategoryFilter);
      if (category) {
        const brandNames = category.brands.map(b => b.name);
        filtered = filtered.filter(s => brandNames.includes(s.brand));
      }
    }
    return sortProducts(filtered, likedSort);
  };

  const generatePDF = async () => {
    const products = activeTab === 'selected' ? getSelectedProductDetails() : getLikedProductDetails();
    if (products.length === 0) {
      alert('내보낼 제품이 없습니다.');
      return null;
    }

    // 임시 컨테이너 생성 (CSS 클래스 제거)
    const container = document.createElement('div');
    container.style.cssText = `
      padding: 40px;
      font-family: Arial, sans-serif;
      line-height: 1.6;
      background-color: #ffffff;
      width: 800px;
      color: #000000;
    `;
    
    // 제목 영역
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 30px;
      padding-bottom: 15px;
      border-bottom: 2px solid #cccccc;
    `;
    
    const title = document.createElement('h1');
    title.textContent = currentProject || '프로젝트';
    title.style.cssText = `
      margin: 0;
      font-size: 28px;
      font-weight: bold;
      color: #000000;
    `;
    
    const date = document.createElement('p');
    date.textContent = `Updated: ${new Date().toLocaleDateString('ko-KR')}`;
    date.style.cssText = `
      margin: 0;
      font-size: 12px;
      color: #666666;
    `;
    
    header.appendChild(title);
    header.appendChild(date);
    container.appendChild(header);
    
    // 제품 목록
    const productList = document.createElement('div');
    productList.style.cssText = 'margin-top: 20px;';
    
    products.forEach((product, index) => {
      const card = document.createElement('div');
      card.style.cssText = `
        margin-bottom: 15px;
        padding: 12px;
        border: 1px solid #dddddd;
        border-radius: 4px;
        background-color: #fafafa;
      `;
      
      // 이미지 추가
      if (product.image) {
        const imgContainer = document.createElement('div');
        imgContainer.style.cssText = `
          margin-bottom: 10px;
          text-align: center;
        `;
        
        const img = document.createElement('img');
        img.src = product.image;
        img.style.cssText = `
          max-width: 100%;
          height: auto;
          max-height: 120px;
          border-radius: 4px;
        `;
        
        imgContainer.appendChild(img);
        card.appendChild(imgContainer);
      }
      
      const productName = document.createElement('h3');
      productName.textContent = `${index + 1}. ${product.name}`;
      productName.style.cssText = `
        margin: 0 0 8px 0;
        font-size: 14px;
        font-weight: bold;
        color: #000000;
      `;
      
      const productNo = document.createElement('p');
      productNo.textContent = `품번: ${product.productNo}`;
      productNo.style.cssText = `
        margin: 4px 0;
        font-size: 12px;
        color: #333333;
      `;
      
      const brand = document.createElement('p');
      brand.textContent = `브랜드: ${product.brand}`;
      brand.style.cssText = `
        margin: 4px 0;
        font-size: 12px;
        color: #333333;
      `;
      
      card.appendChild(productName);
      card.appendChild(productNo);
      card.appendChild(brand);
      
      if (productNotes[product.id]?.location) {
        const location = document.createElement('p');
        location.textContent = `사용 위치: ${productNotes[product.id]?.location}`;
        location.style.cssText = `
          margin: 4px 0;
          font-size: 12px;
          color: #333333;
        `;
        card.appendChild(location);
      }
      
      if (productNotes[product.id]?.memo) {
        const memo = document.createElement('p');
        memo.textContent = `메모: ${productNotes[product.id]?.memo}`;
        memo.style.cssText = `
          margin: 4px 0;
          font-size: 12px;
          color: #333333;
        `;
        card.appendChild(memo);
      }
      
      productList.appendChild(card);
    });
    
    container.appendChild(productList);
    
    // 임시로 DOM에 추가 (html2canvas 사용을 위해)
    document.body.appendChild(container);
    
    try {
      // html2canvas로 이미지 생성
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        removeContainer: false,
        imageTimeout: 5000,
        ignoreElements: (el) => {
          // 모든 style, script, link 태그 무시
          return el.tagName === 'STYLE' || el.tagName === 'SCRIPT' || el.tagName === 'LINK';
        },
      });
      
      // jsPDF로 PDF 생성
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let yPosition = 10;
      pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth, imgHeight);
      
      // 여러 페이지 처리
      let currentHeight = imgHeight;
      while (currentHeight > pageHeight - 20) {
        pdf.addPage();
        yPosition = -currentHeight + pageHeight - 20;
        pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth, imgHeight);
        currentHeight -= pageHeight - 20;
      }
      
      return pdf;
    } finally {
      // DOM에서 제거
      document.body.removeChild(container);
    }
  };



  const handlePreviewPDF = async () => {
    try {
      const pdf = await generatePDF();
      if (pdf) {
        const pdfUrl = pdf.output('dataurlstring');
        setPdfPreviewUrl(pdfUrl);
        setPdfPreviewOpen(true);
      }
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      alert('PDF 미리보기 생성 중 오류가 발생했습니다.');
    }
  };

  const exportToPDF = async () => {
    try {
      const pdf = await generatePDF();
      if (pdf) {
        const tabType = activeTab === 'selected' ? '선택' : '찜';
        const fileName = `${currentProject || '프로젝트'}_${tabType}.pdf`;
        pdf.save(fileName);
      }
    } catch (error) {
      console.error('PDF 내보내기 오류:', error);
      alert('PDF 내보내기 중 오류가 발생했습니다.');
    }
  };
  const handleCategoryClick = (id: number) => {
    if (selectedCategory === id) {
      // 같은 카테고리 재클릭 시 펼침/접힘 토글만
      setExpandedCategory(expandedCategory === id ? null : id);
    } else {
      // 다른 카테고리 선택 시 전체 초기화
      setSelectedCategory(id);
      setExpandedCategory(id);
      setActiveTab('browse');
      setSelectedBrand(null);
      setExpandedBrand(null);
      setSelectedMaterialType(null);
      setExpandedMaterialType(null);
      setSelectedGroup(null);
      setExpandedGroup(null);
      setSelectedLine(null);
    }
  };

  const handleBrandClick = (brand: string) => {
    const key = `${selectedCategory}:${brand}`;
    // 다른 브랜드 선택 시 열기, 같은 브랜드 재클릭 시 토글
    if (selectedBrand !== brand) {
      setSelectedBrand(brand);
      setExpandedBrand(key);
      setSelectedMaterialType(null);
      setExpandedMaterialType(null);
      setSelectedGroup(null);
      setExpandedGroup(null);
      setSelectedLine(null);
    } else {
      // 같은 브랜드 재클릭: 펼침/접힘 토글
      setExpandedBrand(expandedBrand === key ? null : key);
    }
  };
  const handleMaterialTypeClick = (mt: string) => {
    const key = `${selectedBrand}:${mt}`;
    setSelectedMaterialType(mt);
    setExpandedMaterialType(expandedMaterialType === key ? null : key);
    setSelectedGroup(null);
    setExpandedGroup(null);
    setSelectedLine(null);
  };
  const handleGroupClick = (group: string) => {
    setSelectedGroup(group);
    setExpandedGroup(expandedGroup === group ? null : group);
    setSelectedLine(null);
  };

  const handleLineClick = (line: string) => {
    setSelectedLine(line);
  };

  // 정렬 토글 함수
  const toggleSort = (
    current: SortState,
    setter: React.Dispatch<React.SetStateAction<SortState>>,
    key: SortKey
  ) => {
    if (current.key === key) {
      // 같은 키: 오름차순 → 내림차순 → 기본순
      if (current.order === 'asc') setter({ key, order: 'desc' });
      else setter({ key: 'default', order: 'asc' });
    } else {
      setter({ key, order: 'asc' });
    }
  };

  // 정렬 아이콘 컴포넌트
  const SortIcon = ({ sort, targetKey }: { sort: SortState; targetKey: SortKey }) => {
    if (sort.key !== targetKey) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    if (sort.order === 'asc') return <ArrowUp className="w-3 h-3 text-blue-600" />;
    return <ArrowDown className="w-3 h-3 text-blue-600" />;
  };

  // 정렬 버튼 컴포넌트
  const SortButtons = ({ sort, setter }: { sort: SortState; setter: React.Dispatch<React.SetStateAction<SortState>> }) => (
    <div className="flex items-center gap-1">
      <span className="text-xs text-muted-foreground mr-1">정렬:</span>
      <button
        onClick={() => toggleSort(sort, setter, 'default')}
        className={cn(
          'px-2 py-1 rounded text-xs font-medium transition-colors border',
          sort.key === 'default'
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
        )}
      >
        기본
      </button>
      <button
        onClick={() => toggleSort(sort, setter, 'name')}
        className={cn(
          'px-2 py-1 rounded text-xs font-medium transition-colors border flex items-center gap-1',
          sort.key === 'name'
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
        )}
      >
        제품명 <SortIcon sort={sort} targetKey="name" />
      </button>
      <button
        onClick={() => toggleSort(sort, setter, 'productNo')}
        className={cn(
          'px-2 py-1 rounded text-xs font-medium transition-colors border flex items-center gap-1',
          sort.key === 'productNo'
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
        )}
      >
        품번 <SortIcon sort={sort} targetKey="productNo" />
      </button>
    </div>
  );

  // 프로젝트 저장
  const saveProject = () => {
    if (!projectName.trim()) {
      alert('프로젝트명을 입력해주세요.');
      return;
    }

    const newProject: Project = {
      id: Date.now().toString(),
      name: projectName,
      selectedProducts: Array.from(selectedProducts),
      likedProducts: Array.from(likedProducts),
      productNotes: productNotes,
      createdAt: Date.now(),
    };

    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    localStorage.setItem('projects', JSON.stringify(updatedProjects));
    setProjectName('');
    setIsProjectDialogOpen(false);
    alert('프로젝트가 저장되었습니다.');
  };

  // 프로젝트 불러오기
  const loadProject = (project: Project) => {
    setSelectedProducts(new Set(project.selectedProducts));
    setLikedProducts(new Set(project.likedProducts));
    setProductNotes(project.productNotes || {});
    alert(`"${project.name}" 프로젝트가 불러워졌습니다.`);
  };

  // 프로젝트 삭제
  const deleteProject = (projectId: string) => {
    const updatedProjects = projects.filter((p) => p.id !== projectId);
    setProjects(updatedProjects);
    localStorage.setItem('projects', JSON.stringify(updatedProjects));
    alert('프로젝트가 삭제되었습니다.');
  };

  // 새 프로젝트 생성
  const createNewProject = () => {
    if (!newProjectName.trim()) {
      alert('프로젝트명을 입력해주세요.');
      return;
    }

    const newProject: Project = {
      id: Date.now().toString(),
      name: newProjectName,
      selectedProducts: Array.from(selectedProducts),
      likedProducts: Array.from(likedProducts),
      productNotes: productNotes,
      createdAt: Date.now(),
    };

    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    localStorage.setItem('projects', JSON.stringify(updatedProjects));
    setCurrentProject(newProjectName);
    localStorage.setItem('currentProject', newProjectName);
    setNewProjectName('');
    alert('새 프로젝트가 생성되었습니다.');
  };

  return (
    <>
    <MainLayout
      sidebar={
        <SidebarContent>
          {/* 프로젝트명 표시 */}
          <div className="px-2 py-3 border-b border-sidebar-border">
            <p className="text-sm font-semibold text-foreground truncate">
              {currentProject || '프로젝트 미선택'}
            </p>
          </div>
          <CategoryNavigation
            selectedCategory={selectedCategory}
            selectedBrand={selectedBrand}
            selectedMaterialType={selectedMaterialType}
            selectedGroup={selectedGroup}
            selectedLine={selectedLine}
            expandedCategory={expandedCategory}
            expandedBrand={expandedBrand}
            expandedMaterialType={expandedMaterialType}
            expandedGroup={expandedGroup}
            onCategoryClick={handleCategoryClick}
            onBrandClick={handleBrandClick}
            onMaterialTypeClick={handleMaterialTypeClick}
            onGroupClick={handleGroupClick}
            onLineClick={handleLineClick}
          />
          {/* 선택/찜한 제품 탭 - 하부 배치 */}
          <div className="border-t border-sidebar-border px-2 py-3 mt-auto">
            {/* 설정 버튼 */}
            <div className="mb-3">
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => navigate('/settings')}
                title="설정"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('selected')}
                className={cn(
                  'w-full rounded transition-all font-medium text-xs flex flex-col items-center justify-center py-2',
                  activeTab === 'selected'
                    ? 'bg-blue-600 text-white'
                    : 'bg-sidebar-accent text-sidebar-foreground hover:bg-blue-500 hover:text-white'
                )}
                title="선택한 제품"
              >
                <span>선택</span>
                <span>({selectedProducts.size})</span>
              </button>
              <button
                onClick={() => setActiveTab('liked')}
                className={cn(
                  'w-full rounded transition-all font-medium text-xs flex flex-col items-center justify-center py-2',
                  activeTab === 'liked'
                    ? 'bg-red-600 text-white'
                    : 'bg-sidebar-accent text-sidebar-foreground hover:bg-red-500 hover:text-white'
                )}
                title="찜한 제품"
              >
                <span>찜</span>
                <span>({likedProducts.size})</span>
              </button>
            </div>
          </div>
        </SidebarContent>
      }
    >
      {/* Main Content */}
      <div className="h-full flex flex-col">
        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'browse' && (
            <>
              {/* Header */}
              <div className="border-b border-border bg-card p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                                        {/* 1행: 브랜드 + 소재유형 */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                      <Select value={selectedBrand || ''} onValueChange={(value) => handleBrandClick(value)}>
                        <SelectTrigger className="text-xl font-bold h-auto py-2 flex-1">
                          <SelectValue placeholder="브랜드 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {currentCategory?.brands.map((brand) => (
                            <SelectItem key={brand.name} value={brand.name}>
                              {brand.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedBrand && (
                        <>
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                        <Select value={selectedMaterialType || ''} onValueChange={(value) => handleMaterialTypeClick(value)}>
                          <SelectTrigger className="text-xl font-bold h-auto py-2 flex-1">
                            <SelectValue placeholder="소재 유형 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {((currentCategory?.brands.find((b) => b.name === selectedBrand) as any)?.materialTypes ?? []).map((mt: any) => (
                              <SelectItem key={mt.name} value={mt.name}>
                                {mt.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        </>
                      )}
                    </div>
                    {/* 2행: 제품군 + 제품라인 */}
                    {selectedMaterialType && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">3</span>
                        <Select value={selectedGroup || ''} onValueChange={(value) => handleGroupClick(value)}>
                          <SelectTrigger className="text-base h-auto py-1.5 flex-1">
                            <SelectValue placeholder="제품군 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {(((currentCategory?.brands.find((b) => b.name === selectedBrand) as any)
                              ?.materialTypes ?? []).find((mt: any) => mt.name === selectedMaterialType)
                              ?.groups ?? []).map((group: any) => (
                                <SelectItem key={group.name} value={group.name}>
                                  {group.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        {selectedGroup && (
                          <>
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">4</span>
                          <Select value={selectedLine || ''} onValueChange={(value) => handleLineClick(value)}>
                            <SelectTrigger className="text-base h-auto py-1.5 flex-1">
                              <SelectValue placeholder="제품라인 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              {(currentGroupLines).map((line) => (
                                <SelectItem key={line} value={line}>
                                  {line}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {/* Search Bar */}
                <div className="mt-4 flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="품번이나 제품명으로 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                {/* 정렬 버튼 */}
                <div className="mt-3">
                  <SortButtons sort={browseSort} setter={setBrowseSort} />
                </div>
              </div>

              {/* Sample Grid */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredSamples.map((sample) => (
                    <SampleCard
                      key={sample.id}
                      sample={sample}
                      isSelected={selectedProducts.has(sample.id)}
                      isLiked={likedProducts.has(sample.id)}
                      onSelect={() => toggleProductSelection(sample.id)}
                      onLike={() => toggleProductLike(sample.id)}
                      onClick={() => navigate(`/sample/${sample.id}`)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'selected' && (
            <div className="p-6">
              {/* 프로젝트 선택 및 저장 영역 */}
              <div className="mb-6 p-4 bg-muted rounded-lg border border-border">
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">프로젝트 선택</label>
                    <Select value={currentProject} onValueChange={(value) => {
                      const project = projects.find(p => p.name === value);
                      if (project) {
                        setSelectedProducts(new Set(project.selectedProducts));
                        setLikedProducts(new Set(project.likedProducts));
                        setProductNotes(project.productNotes || {});
                        setCurrentProject(value);
                        localStorage.setItem('currentProject', value);
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="프로젝트를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.name}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => {
                      if (currentProject) {
                        const project = projects.find(p => p.name === currentProject);
                        if (project) {
                          const updatedProject = {
                            ...project,
                            selectedProducts: Array.from(selectedProducts),
                            likedProducts: Array.from(likedProducts),
                            productNotes: productNotes,
                          };
                          const updatedProjects = projects.map(p => p.id === project.id ? updatedProject : p);
                          setProjects(updatedProjects);
                          localStorage.setItem('projects', JSON.stringify(updatedProjects));
                          alert('프로젝트가 저장되었습니다.');
                        }
                      } else {
                        alert('프로젝트를 선택해주세요.');
                      }
                    }}
                    className="gap-2"
                  >
                    <Save className="w-4 h-4" />
                    저장
                  </Button>
                </div>
                {/* 새 프로젝트 생성 */}
                <div className="flex gap-3 items-end pt-4 border-t border-border mt-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">새 프로젝트</label>
                    <Input
                      placeholder="새 프로젝트 이름 입력"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          createNewProject();
                        }
                      }}
                    />
                  </div>
                  <Button
                    onClick={createNewProject}
                    className="gap-2"
                    variant="default"
                  >
                    생성
                  </Button>
                </div>
              </div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-4">선택한 제품 ({getSelectedProductDetails().length})</h2>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Select value={selectedCategoryFilter?.toString() || 'all'} onValueChange={(value) => {
                      setSelectedCategoryFilter(value === 'all' ? null : parseInt(value));
                    }}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="공정 필터" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={handlePreviewPDF} variant="outline" className="gap-2">
                      <Search className="w-4 h-4" />
                      미리보기
                    </Button>
                  </div>
                  <Button onClick={exportToPDF} className="gap-2">
                    <Download className="w-4 h-4" />
                    PDF 내보내기
                  </Button>
                </div>
                {/* 정렬 버튼 */}
                <div className="mt-3">
                  <SortButtons sort={selectedSort} setter={setSelectedSort} />
                </div>
              </div>
              <div className="space-y-3">
                {getSelectedProductDetails().map((sample) => {
                  const sampleCategory = CATEGORIES.find(c => c.brands.some(b => b.name === sample.brand));
                  return (
                    <div key={sample.id} className="border border-border rounded-lg p-4 bg-card hover:shadow-md transition-shadow">
                      <div className="flex gap-4">
                        {/* 이미지 */}
                        <div className="flex-shrink-0">
                          <img
                            src={sample.image}
                            alt={sample.name}
                            className="w-24 h-24 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => {
                              if (sampleCategory) {
                                setSelectedCategory(sampleCategory.id);
                                setActiveTab('browse');
                              }
                            }}
                          />
                        </div>
                        {/* 제품 정보 */}
                        <div className="flex-1 space-y-2">
                          {/* 첫 줄: 브랜드 배지 + 공정 배지 */}
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                              {sample.brand}
                            </span>
                            {sampleCategory && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                {sampleCategory.name}
                              </span>
                            )}
                          </div>
                          {/* 둘째 줄: 제품명 > 제품번호 */}
                          <div className="flex items-center gap-3 cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => {
                              if (sampleCategory) {
                                setSelectedCategory(sampleCategory.id);
                                setActiveTab('browse');
                              }
                            }}>
                            <span className="font-semibold text-sm line-clamp-1">{sample.name}</span>
                            <span className="text-xs text-muted-foreground font-mono">{sample.productNo}</span>
                          </div>
                          {/* 사용 위치 */}
                          <div>
                            <Input
                              placeholder="사용 위치"
                              value={productNotes[sample.id]?.location || ''}
                              onChange={(e) => setProductNotes(prev => ({
                                ...prev,
                                [sample.id]: { ...prev[sample.id], location: e.target.value, memo: prev[sample.id]?.memo || '' }
                              }))}
                              className="text-xs h-8"
                            />
                          </div>
                          {/* 메모 입력창 */}
                          <div>
                            <textarea
                              placeholder="메모"
                              value={productNotes[sample.id]?.memo || ''}
                              onChange={(e) => setProductNotes(prev => ({
                                ...prev,
                                [sample.id]: { ...prev[sample.id], location: prev[sample.id]?.location || '', memo: e.target.value }
                              }))}
                              className="text-xs w-full p-2 rounded border border-input bg-background text-foreground resize-none h-16"
                            />
                          </div>
                        </div>
                        {/* 액션 버튼 */}
                        <div className="flex flex-col gap-2 justify-start">
                          <button
                            onClick={() => toggleProductSelection(sample.id)}
                            className="w-8 h-8 rounded flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                            title="선택 해제"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleProductLike(sample.id)}
                            className={cn(
                              'w-8 h-8 rounded flex items-center justify-center transition-colors',
                              likedProducts.has(sample.id)
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            )}
                            title="찜하기"
                          >
                            <Heart className={cn('w-4 h-4', likedProducts.has(sample.id) && 'fill-current')} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'liked' && (
            <div className="p-6">
              {/* 프로젝트 선택 및 저장 영역 */}
              <div className="mb-6 p-4 bg-muted rounded-lg border border-border">
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">프로젝트 선택</label>
                    <Select value={currentProject} onValueChange={(value) => {
                      const project = projects.find(p => p.name === value);
                      if (project) {
                        setSelectedProducts(new Set(project.selectedProducts));
                        setLikedProducts(new Set(project.likedProducts));
                        setProductNotes(project.productNotes || {});
                        setCurrentProject(value);
                        localStorage.setItem('currentProject', value);
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="프로젝트를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.name}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => {
                      if (currentProject) {
                        const project = projects.find(p => p.name === currentProject);
                        if (project) {
                          const updatedProject = {
                            ...project,
                            selectedProducts: Array.from(selectedProducts),
                            likedProducts: Array.from(likedProducts),
                            productNotes: productNotes,
                          };
                          const updatedProjects = projects.map(p => p.id === project.id ? updatedProject : p);
                          setProjects(updatedProjects);
                          localStorage.setItem('projects', JSON.stringify(updatedProjects));
                          alert('프로젝트가 저장되었습니다.');
                        }
                      } else {
                        alert('프로젝트를 선택해주세요.');
                      }
                    }}
                    className="gap-2"
                  >
                    <Save className="w-4 h-4" />
                    저장
                  </Button>
                </div>
                {/* 새 프로젝트 생성 */}
                <div className="flex gap-3 items-end pt-4 border-t border-border mt-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">새 프로젝트</label>
                    <Input
                      placeholder="새 프로젝트 이름 입력"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          createNewProject();
                        }
                      }}
                    />
                  </div>
                  <Button
                    onClick={createNewProject}
                    className="gap-2"
                    variant="default"
                  >
                    생성
                  </Button>
                </div>
              </div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-4">찜한 제품 ({getLikedProductDetails().length})</h2>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Select value={likedCategoryFilter?.toString() || 'all'} onValueChange={(value) => {
                      setLikedCategoryFilter(value === 'all' ? null : parseInt(value));
                    }}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="공정 필터" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={handlePreviewPDF} variant="outline" className="gap-2">
                      <Search className="w-4 h-4" />
                      미리보기
                    </Button>
                  </div>
                  <Button onClick={exportToPDF} className="gap-2">
                    <Download className="w-4 h-4" />
                    PDF 내보내기
                  </Button>
                </div>
                {/* 정렬 버튼 */}
                <div className="mt-3">
                  <SortButtons sort={likedSort} setter={setLikedSort} />
                </div>
              </div>
              <div className="space-y-3">
                {getLikedProductDetails().map((sample) => {
                  const sampleCategory = CATEGORIES.find(c => c.brands.some(b => b.name === sample.brand));
                  return (
                    <div key={sample.id} className="border border-border rounded-lg p-4 bg-card hover:shadow-md transition-shadow">
                      <div className="flex gap-4">
                        {/* 이미지 */}
                        <div className="flex-shrink-0">
                          <img
                            src={sample.image}
                            alt={sample.name}
                            className="w-24 h-24 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => {
                              if (sampleCategory) {
                                setSelectedCategory(sampleCategory.id);
                                setActiveTab('browse');
                              }
                            }}
                          />
                        </div>
                        {/* 제품 정보 */}
                        <div className="flex-1 space-y-2">
                          {/* 첫 줄: 브랜드 배지 + 공정 배지 */}
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                              {sample.brand}
                            </span>
                            {sampleCategory && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                {sampleCategory.name}
                              </span>
                            )}
                          </div>
                          {/* 둘째 줄: 제품명 > 제품번호 */}
                          <div className="flex items-center gap-3 cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => {
                              if (sampleCategory) {
                                setSelectedCategory(sampleCategory.id);
                                setActiveTab('browse');
                              }
                            }}>
                            <span className="font-semibold text-sm line-clamp-1">{sample.name}</span>
                            <span className="text-xs text-muted-foreground font-mono">{sample.productNo}</span>
                          </div>
                          {/* 사용 위치 */}
                          <div>
                            <Input
                              placeholder="사용 위치"
                              value={productNotes[sample.id]?.location || ''}
                              onChange={(e) => setProductNotes(prev => ({
                                ...prev,
                                [sample.id]: { ...prev[sample.id], location: e.target.value, memo: prev[sample.id]?.memo || '' }
                              }))}
                              className="text-xs h-8"
                            />
                          </div>
                          {/* 메모 입력창 */}
                          <div>
                            <textarea
                              placeholder="메모"
                              value={productNotes[sample.id]?.memo || ''}
                              onChange={(e) => setProductNotes(prev => ({
                                ...prev,
                                [sample.id]: { ...prev[sample.id], location: prev[sample.id]?.location || '', memo: e.target.value }
                              }))}
                              className="text-xs w-full p-2 rounded border border-input bg-background text-foreground resize-none h-16"
                            />
                          </div>
                        </div>
                        {/* 액션 버튼 */}
                        <div className="flex flex-col gap-2 justify-start">
                          <button
                            onClick={() => toggleProductSelection(sample.id)}
                            className={cn(
                              'w-8 h-8 rounded flex items-center justify-center transition-colors',
                              selectedProducts.has(sample.id)
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            )}
                            title="선택"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleProductLike(sample.id)}
                            className="w-8 h-8 rounded flex items-center justify-center bg-red-600 text-white hover:bg-red-700 transition-colors"
                            title="찜 해제"
                          >
                            <Heart className="w-4 h-4 fill-current" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>

    {/* PDF 미리보기 Dialog */}
    <Dialog open={pdfPreviewOpen} onOpenChange={setPdfPreviewOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>PDF 미리보기</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto bg-gray-100">
          {pdfPreviewUrl && (
            <embed
              src={pdfPreviewUrl}
              type="application/pdf"
              className="w-full h-full"
              style={{ minHeight: '600px' }}
            />
          )}
        </div>
        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => setPdfPreviewOpen(false)}>
            닫기
          </Button>
          <Button onClick={() => {
            exportToPDF();
            setPdfPreviewOpen(false);
          }} className="gap-2">
            <Download className="w-4 h-4" />
            다운로드
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
