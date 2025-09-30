const tank = document.getElementById('tank');
const weightPool = document.getElementById('weight-pool');
const weightPool2 = document.getElementById('weight-pool2');
const weightPool3 = document.getElementById('weight-pool3');
const waterLevel = document.getElementById('water-level');
const scale = document.getElementById('scale');
const submergedWeightsContainer = document.getElementById('submerged-weights-container');
const waterLevelSlider = document.getElementById('waterLevelSlider');
const waterLevelValue = document.getElementById('waterLevelValue');
const showVolumeCheckbox = document.getElementById('showVolumeCheckbox');
const volumeText = document.getElementById('volume-text');
const volumeValueSpan = volumeText.querySelector('span');

// 실험 상수
const weightVolumes = {
  'weight1': 12, // 황동 추 부피 (mL)
  'weight2': 8,   // 납 추 부피 (mL)
  'rabbit': 15, // 토끼 부피 (mL)
  'cat': 20,    // 고양이 부피 (mL)
  'dog': 25     // 개 부피 (mL)
};
const pxPerMl = 2; // 1mL 당 픽셀 높이 (눈금 기준)
const maxVolumeMl = 200;

// 눈금 생성
for (let i = 1; i < 100; i++) {
  if (i % 10 === 0) continue;
  if (i % 5 === 0) {
    const midtick = document.createElement('div');
    midtick.className = 'midtick';
    midtick.style.bottom = `${i}%`;
    scale.appendChild(midtick);
  } else {
    const subtick = document.createElement('div');
    subtick.className = 'subtick';
    subtick.style.bottom = `${i}%`;
    scale.appendChild(subtick);
  }
}

let weightsInTankIds = [];
let draggingElement = null;

// Helper function to get volume for any weight element
function getWeightVolume(element) {
    if (!element) return 0;
    if (element.classList.contains('weight1')) {
        return weightVolumes['weight1'];
    } else if (element.classList.contains('weight2')) {
        return weightVolumes['weight2'];
    } else if (element.classList.contains('weight3')) {
        const animalType = element.dataset.animalType;
        return weightVolumes[animalType] || 0;
    }
    return 0;
}

// 드래그 앤 드롭 이벤트 리스너 (데스크톱)
document.querySelectorAll('.weight1, .weight2, .weight3').forEach(weight => {
  weight.addEventListener('dragstart', e => {
    e.dataTransfer.setData('text/plain', weight.dataset.id);
  });
});

[tank, weightPool, weightPool2, weightPool3].forEach(zone => {
    zone.addEventListener('dragover', e => e.preventDefault());
    zone.addEventListener('drop', e => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('text/plain');
        handleDrop(draggedId, zone);
    });
});


// 터치 이벤트 리스너 (모바일)
document.querySelectorAll('.weight1, .weight2, .weight3').forEach(weight => {
  weight.addEventListener('touchstart', e => {
    if (e.target.closest('.weight1') || e.target.closest('.weight2') || e.target.closest('.weight3')) {
        e.preventDefault();
        draggingElement = e.target;
        draggingElement.classList.add('dragging');
        document.body.appendChild(draggingElement);
        draggingElement.style.position = 'absolute';
        draggingElement.style.zIndex = '1000';
    }
  }, { passive: false });
});

document.addEventListener('touchmove', e => {
  if (draggingElement) {
    e.preventDefault();
    const touch = e.touches[0];
    draggingElement.style.left = `${touch.clientX - draggingElement.offsetWidth / 2}px`;
    draggingElement.style.top = `${touch.clientY - draggingElement.offsetHeight / 2}px`;
  }
}, { passive: false });

document.addEventListener('touchend', e => {
    if (!draggingElement) return;

    const touch = e.changedTouches[0];
    const draggedId = draggingElement.dataset.id;
    let dropTarget = null;

    const tankRect = tank.getBoundingClientRect();
    const weightPoolRect = weightPool.getBoundingClientRect();
    const weightPool2Rect = weightPool2.getBoundingClientRect();
    const weightPool3Rect = weightPool3.getBoundingClientRect();

    if (touch.clientX >= tankRect.left && touch.clientX <= tankRect.right &&
        touch.clientY >= tankRect.top && touch.clientY <= tankRect.bottom) {
        dropTarget = tank;
    } else if (touch.clientX >= weightPoolRect.left && touch.clientX <= weightPoolRect.right &&
               touch.clientY >= weightPoolRect.top && touch.clientY <= weightPoolRect.bottom) {
        dropTarget = weightPool;
    } else if (touch.clientX >= weightPool2Rect.left && touch.clientX <= weightPool2Rect.right &&
               touch.clientY >= weightPool2Rect.top && touch.clientY <= weightPool2Rect.bottom) {
        dropTarget = weightPool2;
    } else if (touch.clientX >= weightPool3Rect.left && touch.clientX <= weightPool3Rect.right &&
               touch.clientY >= weightPool3Rect.top && touch.clientY <= weightPool3Rect.bottom) {
        dropTarget = weightPool3;
    }

    const originalPool = draggingElement.classList.contains('weight1') ? weightPool :
                         draggingElement.classList.contains('weight2') ? weightPool2 : weightPool3;
    if (!dropTarget) {
        dropTarget = originalPool;
    }

    handleDrop(draggedId, dropTarget);

    draggingElement.classList.remove('dragging');
    draggingElement.style.position = '';
    draggingElement.style.zIndex = '';
    draggingElement.style.left = '';
    draggingElement.style.top = '';

    if (draggingElement.parentElement === document.body) {
        originalPool.appendChild(draggingElement);
    }
    
    draggingElement = null;
});


function handleDrop(draggedId, targetZone) {
    const sourceElement = document.querySelector(`[data-id="${draggedId}"]`);
    const wasInTank = weightsInTankIds.includes(draggedId);

    if (targetZone === tank) {
        if (!wasInTank) {
            // 보관함 -> 탱크로 이동하는 경우
            
            // 1. 물이 없는 경우
            if (parseInt(waterLevelSlider.value) < 1) { // 0일 경우 방지
                alert("먼저 메스실린더에 물을 넣어주세요.");
                return;
            }

            // 현재 물 높이와 쌓일 추의 높이 계산
            const baseWaterLevelMl = parseInt(waterLevelSlider.value);
            const currentAddedVolumeMl = weightsInTankIds.reduce((total, id) => {
                const el = document.querySelector(`[data-id="${id}"]`);
                return total + getWeightVolume(el);
            }, 0);
            
            const currentWaterLevelPx = (baseWaterLevelMl + currentAddedVolumeMl) * pxPerMl;

            let potentialStackedHeightPx = 0;
            weightsInTankIds.forEach(id => {
                const el = document.querySelector(`[data-id="${id}"]`);
                potentialStackedHeightPx += el.offsetHeight;
            });
            potentialStackedHeightPx += sourceElement.offsetHeight;
            potentialStackedHeightPx += Math.max(0, weightsInTankIds.length) * 2; // 추 사이의 간격

            // 2. 물체가 증가할 물 높이에 완전히 잠기는지 확인
            if (potentialStackedHeightPx > currentWaterLevelPx) {
                alert("물체가 물에 잠기도록 해주세요.");
                return;
            }

            // 3. 물이 넘치는지 확인
            const potentialTotalVolumeMl = baseWaterLevelMl + currentAddedVolumeMl + getWeightVolume(sourceElement);
            if (potentialTotalVolumeMl > maxVolumeMl) {
                alert("물이 넘치지 않도록 해주세요.");
            } else {
                weightsInTankIds.push(draggedId);
                sourceElement.style.visibility = 'hidden';
            }
        }
    } else { // targetZone이 보관함인 경우
        if (wasInTank) {
            // 탱크 -> 보관함으로 이동하는 경우
            const idx = weightsInTankIds.indexOf(draggedId);
            if (idx > -1) {
                weightsInTankIds.splice(idx, 1);
                sourceElement.style.visibility = 'visible';
            }
        }
    }

    renderWeightsInTank();
    updateWaterLevel();
}


// 물탱크 안의 추 렌더링
function renderWeightsInTank() {
  submergedWeightsContainer.innerHTML = '';
  weightsInTankIds.slice().reverse().forEach(id => {
    const originalWeight = document.querySelector(`[data-id="${id}"]`);
    const weight = document.createElement('div');
    weight.className = originalWeight.className; 
    weight.dataset.id = id;
    
    if (originalWeight.dataset.animalType) {
        weight.dataset.animalType = originalWeight.dataset.animalType;
    }

    weight.draggable = true;
    weight.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', id));
    
    weight.addEventListener('touchstart', e => {
        e.preventDefault();
        
        const weightId = e.target.dataset.id;
        const originalElement = document.querySelector(`[data-id="${weightId}"]`);
        if (!originalElement) return;

        draggingElement = originalElement;

        draggingElement.style.visibility = 'visible'; 
        draggingElement.classList.add('dragging');
        document.body.appendChild(draggingElement);
        draggingElement.style.position = 'absolute';
        draggingElement.style.zIndex = '1000';

        const touch = e.touches[0];
        draggingElement.style.left = `${touch.clientX - draggingElement.offsetWidth / 2}px`;
        draggingElement.style.top = `${touch.clientY - draggingElement.offsetHeight / 2}px`;
        
        e.target.style.visibility = 'hidden';

    }, { passive: false });

    submergedWeightsContainer.appendChild(weight);
  });
}

// 물 높이 업데이트
function updateWaterLevel() {
  const baseWaterLevelMl = parseInt(waterLevelSlider.value);
  const addedVolumeMl = weightsInTankIds.reduce((totalVolume, id) => {
    const weightElement = document.querySelector(`[data-id="${id}"]`);
    return totalVolume + getWeightVolume(weightElement);
  }, 0);
  const totalVolumeMl = baseWaterLevelMl + addedVolumeMl;
  const totalHeight = totalVolumeMl * pxPerMl;
  waterLevel.style.height = totalHeight + 'px';
  updateVolumeDisplay();

  // 탱크 안의 추 유무에 따라 슬라이더 활성화/비활성화
  waterLevelSlider.disabled = weightsInTankIds.length > 0;
}

// 부피 표시 업데이트
function updateVolumeDisplay() {
    const baseWaterLevelMl = parseInt(waterLevelSlider.value);
    const addedVolumeMl = weightsInTankIds.reduce((total, id) => {
        const el = document.querySelector(`[data-id="${id}"]`);
        return total + getWeightVolume(el);
    }, 0);
    const totalVolumeMl = baseWaterLevelMl + addedVolumeMl;
    volumeValueSpan.textContent = totalVolumeMl;
    volumeText.style.display = showVolumeCheckbox.checked ? 'block' : 'none';
}

// 슬라이더 및 체크박스 이벤트
waterLevelSlider.addEventListener('input', () => {
    waterLevelValue.textContent = waterLevelSlider.value;
    updateWaterLevel();
});
showVolumeCheckbox.addEventListener('change', updateVolumeDisplay);

// 비활성화된 슬라이더 클릭 시 알림 표시
waterLevelSlider.addEventListener('mousedown', () => {
    if (waterLevelSlider.disabled) {
        alert("메스실린더 안에 물체를 모두 꺼내주세요.");
    }
});
// 터치 환경에서도 동일하게 알림 표시
waterLevelSlider.addEventListener('touchstart', () => {
    if (waterLevelSlider.disabled) {
        alert("메스실린더 안에 물체를 모두 꺼내주세요.");
    }
});


// 초기화
waterLevelValue.textContent = waterLevelSlider.value;
updateWaterLevel();

// ✨✨✨ 모바일에서 길게 눌렀을 때 메뉴 뜨는 현상 방지 ✨✨✨
document.querySelectorAll('.weight1, .weight2, .weight3, #waterLevelSlider').forEach(el => {
  el.addEventListener('contextmenu', e => e.preventDefault());
});