# 컬쳐맵 코드 읽기: React 상태와 데이터 흐름

이 문서는 기획서가 아니라 현재 소스 코드를 기준으로 작성했습니다. 코드를 함께 열어 보며 props, 컴포넌트 state, Zustand, TanStack Query가 각각 어디에 쓰이는지 따라가 보세요.

## 1. 상태를 네 종류로 나누기

| 종류 | 프로젝트에서의 예 | 담당 코드 | 수명과 역할 |
| --- | --- | --- | --- |
| Props | `category`, `items`, `item`, `onClose` | `CultureCategoryPage`, `NaverMapContainer`, `CultureCard`, `DetailPanel` | 부모가 자식에게 전달하는 입력값. 전달받은 자식이 직접 원본을 바꾸지 않습니다. |
| 컴포넌트 state | 정렬값, 박스오피스 모드, 페이지, 모바일 메뉴 열림 여부, 지도 카테고리 선택 | `CultureCategoryPage`, `Header`, `NaverMapContainer`, `useNaverMap` | 해당 컴포넌트 또는 훅이 소유하는 UI 상태입니다. `useState`로 갱신하면 관련 UI가 다시 렌더링됩니다. |
| 공유 클라이언트 state | 시작일·종료일·지역·선택 마커, 위시리스트 ID | `useFilterStore`, `useBookmarkStore` | 서로 떨어진 컴포넌트가 함께 읽고 변경하는 상태입니다. Zustand가 관리합니다. |
| 서버 state | 문화 행사 API 응답, 로딩·에러·캐시 | `useCultureData` | 서버에서 가져와 캐싱하고 다시 요청해야 하는 데이터입니다. TanStack Query가 관리합니다. |

**구분하는 질문:** 이 값이 컴포넌트 하나에서만 쓰이는가? 여러 화면이 공유하는가? 서버에서 다시 받아야 하는가? 값의 소유자와 수명을 먼저 정하면 도구 선택이 쉬워집니다.

## 2. Props: 부모에서 자식으로 값과 동작 전달

React의 props는 컴포넌트의 입력입니다. 데이터뿐 아니라 이벤트 함수도 전달할 수 있습니다. 아래 `Button`은 자체 상태를 갖지 않고, 모양을 정하는 `variant`와 `className`을 받은 뒤 나머지 버튼 속성도 실제 `<button>`에 전달합니다.

```jsx
export default function Button({ variant = "primary", className = "", ...props }) {
  const variants = { primary: "bg-indigo-600 text-white" };
  const buttonClassName = `${variants[variant] ?? variants.primary} ${className}`;
  return <button className={buttonClassName} {...props} />;
}
```

예를 들어 호출하는 쪽에서 `onClick`, `type`, `aria-label`, `children`을 전달하면 `...props`를 통해 HTML 버튼으로 전달됩니다. 이 패턴 덕분에 공통 버튼 스타일을 재사용하면서 일반 버튼 기능도 유지합니다.

문화 목록의 props 흐름은 다음과 같습니다.

```text
CultureCategoryPage
  └─ CultureList(items, emptyMessage)
       └─ CultureCard(item)
```

`CultureCategoryPage`가 받은 `category`와 날짜 범위로 데이터를 요청하고, 결과 중 현재 페이지의 10개를 `CultureList`에 `items`로 넘깁니다. `CultureList`는 배열을 순회하면서 각 항목을 `CultureCard`의 `item` prop으로 전달합니다. `key={item.id}`는 목록 항목의 식별자로 React가 변경된 항목을 효율적으로 구분하게 합니다.

지도에서도 같은 원칙을 볼 수 있습니다. `NaverMapContainer`는 `items`를 각 `MapMarker`에 전달하고, 선택된 `item`은 `DetailPanel`에 전달합니다. 마커를 클릭하면 `MapMarker`가 Zustand의 `setSelectedMapItem` action을 직접 호출합니다. `NaverMapContainer`가 store의 선택값을 구독하므로 변경된 항목이 `DetailPanel` prop으로 전달됩니다. 이 예제에서는 부모가 callback prop을 자식에게 전달하는 대신 두 컴포넌트가 공유 store를 통해 연결됩니다.

## 3. 로컬 state: 그 화면에만 필요한 값

`CultureCategoryPage`의 정렬 상태는 해당 목록 화면에서만 쓰입니다.

```jsx
const [sort, setSort] = useState("popularityRank");
const [boxOfficeType, setBoxOfficeType] = useState("daily");
const { data = [] } = useCultureData(category, { sort, boxOfficeType });
```

`sort`는 현재 정렬 기준이고, `setSort`는 그 값을 바꾸는 함수입니다. `SortSelect`는 값을 직접 소유하지 않고 `value`와 `onChange`를 props로 받습니다.

```text
CultureCategoryPage가 sort 소유
  ├─ SortSelect(value=sort, onChange=setSort)
  └─ useCultureData(category, { sort })
```

이런 구조를 **controlled component**라고 부릅니다. 입력 UI의 표시값은 부모 state가 결정하고, 사용자의 변경은 callback을 통해 부모에 전달됩니다. `Header`의 모바일 메뉴 열림 여부도 `Header` 안에서만 쓰는 로컬 state입니다.

## 4. Zustand: 컴포넌트 사이에 공유할 클라이언트 state

### 필터와 지도 선택

`src/store/useFilterStore.js`가 다음 값을 관리합니다.

```js
startDate: getTodayDate(),
endDate: getTodayDate(),
selectedRegion: "ALL",
selectedMapItem: null,
```

헤더의 시작일·종료일 입력은 `setStartDate`와 `setEndDate`로 store를 갱신합니다. 시작일이 종료일보다 늦어지면 반대쪽 날짜도 맞춰 범위가 뒤집히지 않게 합니다. `useCultureData`의 query key에 두 날짜가 들어가므로 범위가 바뀌면 새 조건으로 조회합니다. 지도 페이지의 지역 선택도 같은 방식으로 여러 컴포넌트에서 공유됩니다.

마커 클릭 흐름은 다음과 같습니다.

```text
MapMarker 클릭
  → setSelectedMapItem(item)
  → useFilterStore의 selectedMapItem 변경
  → NaverMapContainer가 새 item을 DetailPanel에 전달
  → 상세 패널 표시
```

필터 store에는 `persist` 미들웨어가 없습니다. 따라서 이 상태들은 브라우저 새로고침 후 저장된 값으로 복구되지 않습니다. 특히 날짜는 URL에도 동기화되지 않습니다.

### 위시리스트와 LocalStorage

`src/store/useBookmarkStore.js`는 위시리스트 ID 배열을 관리하고 Zustand의 `persist` 미들웨어로 저장합니다.

```js
toggleBookmark: (id) =>
  set((state) => ({
    bookmarks: state.bookmarks.includes(id)
      ? state.bookmarks.filter((bookmarkId) => bookmarkId !== id)
      : [...state.bookmarks, id],
  }))
```

현재 포함되어 있으면 해당 ID를 제외한 새 배열을 만들고, 없으면 기존 배열에 추가합니다. `partialize`는 저장 대상이 `bookmarks`뿐이라고 지정하고, `name`은 LocalStorage 키(`culture-map-storage`)가 됩니다. 따라서 위시리스트는 새로고침 후에도 유지됩니다.

Zustand store도 결국 React 컴포넌트에서 구독해 사용합니다. 필요한 값만 selector로 선택하면 관련 없는 store 값 변경에 대한 렌더링을 줄이고, 어떤 상태에 의존하는지도 명확해집니다.

```js
const startDate = useFilterStore((state) => state.startDate);
const endDate = useFilterStore((state) => state.endDate);
const setStartDate = useFilterStore((state) => state.setStartDate);
const setEndDate = useFilterStore((state) => state.setEndDate);
```

## 5. TanStack Query: API 데이터와 캐시

`src/hooks/useCultureData.js`는 화면과 API 유틸리티 사이의 데이터 훅입니다.

```text
화면
  → useCultureData(category, options)
  → useQuery(queryKey, queryFn)
  → src/utils/api.js의 fetch 함수
  → 로딩/에러/데이터 결과를 화면에 반환
```

`queryKey`에는 카테고리, 시작일, 종료일, 선택 지역, 개수 제한, 정렬 기준, 박스오피스 조회 모드가 들어갑니다. 이 값들이 바뀌면 TanStack Query는 다른 조건의 캐시로 구분하고 필요한 요청을 수행합니다. 화면은 `data`, `isLoading`, `isError`, `refetch`를 사용해 결과·로딩·오류·재시도 UI를 표시합니다.

Provider는 `src/components/common/ReactQueryProvider.jsx`에 있고, `src/app/layout.js`에서 앱 화면을 감쌉니다. QueryClient의 기본 설정은 캐시 데이터를 60초 동안 fresh로 취급하고, 창에 다시 포커스될 때 자동 재요청하지 않는 것입니다.

비영화 일정은 시작일·종료일 범위와 일정 기간이 겹치는지 클라이언트에서 필터링합니다. 영화는 KOBIS API가 일일/주말 단위이므로 종료일 기준으로 조회하고, 오늘 일일 데이터가 없으면 전일 데이터를 사용합니다. 주말 조회는 선택 종료일이 속한 주의 일요일을 요청합니다. 지역은 API 응답 후 `address`에 선택 지역명이 포함되는지 클라이언트에서 필터링합니다. 홈 데이터는 카테고리별 요청을 `Promise.allSettled`로 모으므로 한 카테고리 요청 실패가 나머지 결과를 모두 버리지 않습니다.

## 6. 화면 하나를 처음부터 따라가기

카테고리 화면을 읽는 순서:

1. 해당 route의 `page.jsx`에서 `CultureCategoryPage`에 어떤 `category`를 넘기는지 확인합니다.
2. `CultureCategoryPage`에서 로컬 `sort`, `boxOfficeType`, 페이지 상태와 Zustand의 날짜 범위를 확인합니다.
3. `useCultureData`의 `queryKey`와 `queryFn`이 날짜 범위·지역·정렬을 어떻게 반영하는지 봅니다.
4. `src/utils/api.js`에서 JSON Server와 KOBIS 요청, 일정 겹침 필터, 정렬을 확인합니다.
5. `/api/box-office` 서버 라우트에서 KOBIS 응답을 화면용 데이터로 정규화하는 과정을 확인합니다.
6. 결과가 현재 페이지 10개로 잘린 뒤 `CultureList`와 `CultureCard` props로 내려가는 것을 추적합니다.
7. 위시리스트 버튼 클릭이 `toggleBookmark`를 통해 어떻게 공유 상태와 LocalStorage를 바꾸는지 확인합니다.

지도 화면은 `src/app/map/page.jsx`에서 시작해 `useCultureData("all")`, `NaverMapContainer`, `MapMarker`, `DetailPanel` 순으로 읽으면 됩니다. SDK 객체와 지도 생성 과정은 `src/hooks/useNaverMap.js`에서 확인할 수 있습니다.

## 7. 실제 구현된 기능

- **날짜 범위:** `useFilterStore`는 오늘을 시작일·종료일로 저장합니다. 헤더의 두 날짜 입력이 범위를 갱신하고, query key에 반영됩니다. 비영화 일정은 선택 구간과 겹치는 일정을 반환하며 영화는 종료일 기준으로 조회합니다.
- **카테고리 페이지네이션:** `CultureCategoryPage`가 필터링·정렬된 결과를 10개씩 나눠 보여줍니다. 날짜 범위·정렬·박스오피스 모드가 바뀌면 1페이지로 돌아옵니다. KOBIS 박스오피스는 최대 10개라 보통 한 페이지입니다.
- **데이터 공급원:** `db.json`의 문화 배열은 화면에서 사용하지 않습니다. 영화는 KOBIS, 콘서트·뮤지컬은 KOPIS, 지역 행사는 한국관광콘텐츠랩, 전시는 문화포털 데이터를 사용합니다.
- **KOBIS 박스오피스:** `/api/box-office`가 일일 또는 주말 데이터를 조회합니다. 오늘 일일 데이터가 없으면 전일 데이터를 반환할 수 있습니다. `salesAmt`는 해당 기간 매출, `salesAcc`는 누적 매출입니다.
- **KOPIS 공연목록:** `/api/kopis`가 콘서트·뮤지컬 공연목록을 XML로 조회한 뒤 화면용 공통 데이터로 변환합니다. API 키는 서버의 `KOPIS_API_KEY` 환경변수로만 전달합니다. KOPIS 목록에는 인기순위와 공연장 좌표가 없어 시작일·이름순만 제공하며, 지도 좌표는 별도 공연장 상세 연동이 필요합니다.
- **행사·전시 API:** `/api/tour-events`는 한국관광콘텐츠랩 JSON 응답을, `/api/culture-exhibitions`는 문화포털 응답을 공통 문화 데이터로 변환합니다. 키는 각각 서버 환경변수 `KTO_TOUR_API_KEY`, `CULTURE_PORTAL_API_KEY`로 설정합니다.
- **극장 마스터:** `/api/movie-theaters`와 `fetchMovieTheaters()`는 행정안전부 영화상영관 인허가 정보를 조회합니다. 극장 마스터에는 영화별 상영 시간표가 없으므로 실제 상영 여부를 연결하지 않습니다.
- **포스터:** KOBIS 박스오피스 응답은 포스터 주소를 제공하지 않습니다. `CultureCard`는 `posterUrl` 또는 `imageUrl`을 사용할 수 있고, 둘 다 없으면 순위·제목 커버를 표시합니다.
- **지역 필터:** 지도 화면의 지역 선택값은 `selectedRegion`으로 Zustand에 저장됩니다. `useCultureData`가 데이터를 받은 뒤 각 항목의 `address`에 선택 지역이 포함되는지 확인해 필터링합니다.
- **지도 상세 선택:** 마커를 클릭하면 선택한 문화 항목이 `selectedMapItem`에 저장됩니다. 지도 컨테이너는 이 값을 구독하고 `DetailPanel`에 전달하며, 닫기 버튼은 선택값을 `null`로 초기화합니다.
- **위시리스트 저장:** `useBookmarkStore`는 문화 항목 ID를 추가·삭제하고, Zustand `persist` 미들웨어를 통해 `culture-map-storage`라는 LocalStorage 키에 위시리스트 배열을 저장합니다.
- **API 데이터와 캐시:** `useCultureData`가 TanStack Query를 사용해 요청·캐시·로딩·오류 상태를 제공합니다. QueryClient는 데이터를 60초 동안 fresh로 취급하고 창 포커스 시 자동 재요청하지 않도록 설정되어 있습니다.
- **데이터 가공:** `src/utils/api.js`가 카테고리별 API 요청, 날짜 필터링, 정렬, 개수 제한을 담당합니다. 지역 필터는 요청 후 `useCultureData`에서 적용합니다. 홈 화면은 `Promise.allSettled`를 사용해 일부 카테고리 요청이 실패해도 성공한 결과를 표시합니다.

## 8. 스스로 확인해 볼 질문

- `CultureCard`가 `bookmarks`를 직접 변경하지 않고 `toggleBookmark`를 호출하는 이유는 무엇일까요?
- `SortSelect` 안에서 `useState`를 쓰지 않고 부모에서 `value`와 `onChange`를 받는 이유는 무엇일까요?
- 시작일·종료일을 `queryKey`에서 빼면 범위 변경 후 어떤 캐시 문제가 생길까요?
- 일정 기간 겹침을 `item.startDate <= endDate && item.endDate >= startDate`로 판정하는 이유는 무엇일까요?
- KOBIS의 `salesAmt`와 `salesAcc`는 각각 어떤 매출을 뜻할까요?
- KOBIS가 최대 10개 영화를 반환하면 10개 단위 페이지네이션은 어떻게 보일까요?
- 위시리스트 store에서 `partialize`를 제거하면 LocalStorage에 무엇이 더 저장될까요?
- 지도 상태를 전역 store 대신 `NaverMapContainer`의 로컬 state로 옮기면 어떤 컴포넌트 경계가 영향을 받을까요?
- `Header`에서 store 전체를 구독하는 것과 날짜만 selector로 구독하는 것의 렌더링 차이는 무엇일까요?

## 관련 파일

- [상태 store](src/store/useFilterStore.js)
- [위시리스트 store](src/store/useBookmarkStore.js)
- [문화 데이터 훅](src/hooks/useCultureData.js)
- [지도 SDK 훅](src/hooks/useNaverMap.js)
- [API 유틸리티](src/utils/api.js)
- [박스오피스 API 라우트](src/app/api/box-office/route.js)
- [KOPIS 공연 API 라우트](src/app/api/kopis/route.js)
- [영화관 마스터 API 라우트](src/app/api/movie-theaters/route.js)
- [카테고리 목록·페이지네이션](src/components/culture/CultureCategoryPage.jsx)
- [React Query Provider](src/components/common/ReactQueryProvider.jsx)