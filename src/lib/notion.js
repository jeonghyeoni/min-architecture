import { Client } from "@notionhq/client";
import fs from "fs-extra";
import path from "path";
import download from "image-downloader";

const notion = new Client({
  auth: import.meta.env.NOTION_API_KEY,
});

console.log("Notion Client:", notion);
console.log("Databases:", notion.databases);

const DATABASE_ID = import.meta.env.NOTION_DATABASE_ID;

// 이미지를 저장할 폴더 위치 (public/notion-images)
const IMAGE_DIR = path.join(process.cwd(), "public", "notion-images");

// 이미지를 다운로드하는 함수
async function downloadImage(url, id) {
  // 폴더가 없으면 생성
  await fs.ensureDir(IMAGE_DIR);

  const extension = url.split("?")[0].split(".").pop() || "jpg";
  const filename = `${id}.${extension}`;
  const filepath = path.join(IMAGE_DIR, filename);
  
  // 이미 파일이 있으면 다운로드 건너뛰기 (빌드 속도 최적화)
  // 만약 이미지를 수정했다면 public/notion-images 폴더를 지우고 다시 빌드하면 됨
  if (fs.existsSync(filepath)) {
    return `/notion-images/${filename}`;
  }

  try {
    await download.image({
      url: url,
      dest: filepath,
    });
    console.log(`이미지 다운로드 완료: ${filename}`);
    return `/notion-images/${filename}`;
  } catch (e) {
    console.error(`이미지 다운로드 실패 (${id}):`, e);
    return null;
  }
}

const TYPE_MAP = {
  "증개축": "Extension",
  "대수리": "Extension",  
  "주택건축": "NewBuild",
  "설비": "Repair",
  "부분수리": "Repair" 
};

export async function getProjects() {
  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      sorts: [{ property: "ID", direction: "ascending" }],
    });

    // Promise.all을 사용하여 병렬로 데이터 처리
    const projects = await Promise.all(
      response.results.map(async (page) => {
        const props = page.properties;

        const krType = props.Type?.select?.name || "기타";
        const enType = TYPE_MAP[krType] || "Etc";

        // 1. Notion에 업로드된 파일이나 외부 URL 가져오기
        let mainImageUrl = "";
        const imageProp = props.Image?.files[0]; // '파일 및 미디어' 속성일 경우
        if (imageProp) {
            mainImageUrl = imageProp.type === "file" ? imageProp.file.url : imageProp.external.url;
        }

        // 2. 갤러리 이미지들 가져오기
        let galleryImageUrls = [];
        if (props.Images?.files) {
            galleryImageUrls = props.Images.files.map(f => f.type === "file" ? f.file.url : f.external.url);
        }

        const projectId = props.ID?.number || 0;

        // 3. 이미지 다운로드 및 로컬 경로로 변환 (비동기 처리)
        // 메인 이미지
        let finalMainImage = "";
        if (mainImageUrl) {
            finalMainImage = await downloadImage(mainImageUrl, `main-${projectId}`);
        }

        // 갤러리 이미지
        const finalGalleryImages = await Promise.all(
            galleryImageUrls.map((url, idx) => downloadImage(url, `gallery-${projectId}-${idx}`))
        );
        
        // Before/After 이미지
        let beforeUrl = "";
        const beforeProp = props.BeforeImage?.files[0];
        if (beforeProp) beforeUrl = beforeProp.type === "file" ? beforeProp.file.url : beforeProp.external.url;
        const finalBeforeImage = beforeUrl ? await downloadImage(beforeUrl, `before-${projectId}`) : null;

        let afterUrl = "";
        const afterProp = props.AfterImage?.files[0];
        if (afterProp) afterUrl = afterProp.type === "file" ? afterProp.file.url : afterProp.external.url;
        const finalAfterImage = afterUrl ? await downloadImage(afterUrl, `after-${projectId}`) : null;

        // 메인 이미지가 갤러리 배열 맨 앞에 없으면 추가 (화면 표시용)
        const displayImages = finalGalleryImages.filter(Boolean);
        if (finalMainImage && !displayImages.includes(finalMainImage)) {
            displayImages.unshift(finalMainImage);
        }

        return {
          id: props.ID?.number || 0,
          title: props.Name?.title[0]?.plain_text || "제목 없음",
          type: enType,  // 변환된 영어 코드 (NewBuild 등) -> 필터링용
          typeKr: krType, // Notion에서 가져온 한글 (주택건축 등) -> 화면 표시용
          year: props.Year?.rich_text[0]?.plain_text || "",
          location: props.Location?.rich_text[0]?.plain_text || "",
          description: props.Description?.rich_text[0]?.plain_text || "",
          // 변환된 로컬 경로 사용
          image: finalMainImage || "", 
          images: displayImages,
          beforeImage: finalBeforeImage,
          afterImage: finalAfterImage,
        };
      })
    );

    return projects;
  } catch (error) {
    console.error("Notion API Error:", error);
    return [];
  }
}