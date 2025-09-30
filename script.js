const tank = document.getElementById('tank');
const weightPool = document.getElementById('weight-pool');
const weightPool2 = document.getElementById('weight-pool2');
const weightPool3 = document.getElementById('weight-pool3'); // ✨ Added
const waterLevel = document.getElementById('water-level');
const scale = document.getElementById('scale');
const submergedWeightsContainer = document.getElementById('submerged-weights-container');
const waterLevelSlider = document.getElementById('waterLevelSlider');
const waterLevelValue = document.getElementById('waterLevelValue');
const showVolumeCheckbox = document.getElementById('showVolumeCheckbox');
const volumeText = document.getElementById('volume-text');
const volumeValueSpan = volumeText.querySelector('span');

// 실험 상수
// ✨ Added volumes for animals
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

// ✨ Helper function to get volume for any weight element
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
// ✨ Updated selector to include .weight3
document.querySelectorAll('.weight1, .weight2, .weight3').forEach(weight => {
  weight.addEventListener('dragstart', e => {
    e.dataTransfer.setData('text/plain', weight.dataset.id);
  });
});

// ✨ Updated drop zones to include weightPool3
[tank, weightPool, weightPool2, weightPool3].forEach(zone => {
    zone.addEventListener('dragover', e => e.preventDefault());
    zone.addEventListener('drop', e => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('text/plain');
        handleDrop(draggedId, zone);
    });
});


// 터치 이벤트 리스너 (모바일)
// ✨ Updated selector to include .weight3
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
    const weightPool3Rect = weightPool3.getBoundingClientRect(); // ✨ Added

    if (touch.clientX >= tankRect.left && touch.clientX <= tankRect.right &&
        touch.clientY >= tankRect.top && touch.clientY <= tankRect.bottom) {
        dropTarget = tank;
    } else if (touch.clientX >= weightPoolRect.left && touch.clientX <= weightPoolRect.right &&
               touch.clientY >= weightPoolRect.top && touch.clientY <= weightPoolRect.bottom) {
        dropTarget = weightPool;
    } else if (touch.clientX >= weightPool2Rect.left && touch.clientX <= weightPool2Rect.right &&
               touch.clientY >= weightPool2Rect.top && touch.clientY <= weightPool2Rect.bottom) {
        dropTarget = weightPool2;
    // ✨ Added check for weightPool3
    } else if (touch.clientX >= weightPool3Rect.left && touch.clientX <= weightPool3Rect.right &&
               touch.clientY >= weightPool3Rect.top && touch.clientY <= weightPool3Rect.bottom) {
        dropTarget = weightPool3;
    }

    // ✨ Updated logic to determine the original pool
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

// 🚨 [수정된 부분] 드롭 로직 전체 개선
function handleDrop(draggedId, targetZone) {
    const sourceElement = document.querySelector(`[data-id="${draggedId}"]`);
    const wasInTank = weightsInTankIds.includes(draggedId);

    if (targetZone === tank) {
        if (!wasInTank) {
            // 보관함 -> 탱크
            const baseWaterLevelMl = parseInt(waterLevelSlider.value);
            const currentAddedVolumeMl = weightsInTankIds.reduce((total, id) => {
                const el = document.querySelector(`[data-id="${id}"]`);
                return total + getWeightVolume(el); // ✨ Use helper
            }, 0);

            const potentialTotalVolumeMl = baseWaterLevelMl + currentAddedVolumeMl + getWeightVolume(sourceElement); // ✨ Use helper
            if (potentialTotalVolumeMl > maxVolumeMl) {
                alert("물이 넘치지 않도록 해주세요.");
            } else {
                weightsInTankIds.push(draggedId);
                sourceElement.style.visibility = 'hidden';
            }
        }
        // 탱크 -> 탱크는 아무것도 안 함 (상태 변화 없음)
    } else { // targetZone is a pool
        if (wasInTank) {
            // 탱크 -> 보관함
            const idx = weightsInTankIds.indexOf(draggedId);
            if (idx > -1) {
                weightsInTankIds.splice(idx, 1);
                sourceElement.style.visibility = 'visible';
            }
        }
        // 보관함 -> 보관함은 아무것도 안 함 (상태 변화 없음)
    }

    renderWeightsInTank();
    updateWaterLevel();
}


// 🚨 [수정된 부분] 물탱크 안의 추 렌더링 및 터치 로직
function renderWeightsInTank() {
  submergedWeightsContainer.innerHTML = '';
  weightsInTankIds.slice().reverse().forEach(id => {
    const originalWeight = document.querySelector(`[data-id="${id}"]`);
    const weight = document.createElement('div');
    weight.className = originalWeight.className; 
    weight.dataset.id = id;
    
    // ✨ Copy animal type data if it exists
    if (originalWeight.dataset.animalType) {
        weight.dataset.animalType = originalWeight.dataset.animalType;
    }

    weight.draggable = true;
    weight.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', id));
    
    // 물탱크 안의 추를 터치했을 때의 동작
    weight.addEventListener('touchstart', e => {
        e.preventDefault();
        
        const weightId = e.target.dataset.id;
        const originalElement = document.querySelector(`[data-id="${weightId}"]`);
        if (!originalElement) return;

        draggingElement = originalElement;

        // 원본 요소를 보이게 하고 드래그 시작
        draggingElement.style.visibility = 'visible'; 
        draggingElement.classList.add('dragging');
        document.body.appendChild(draggingElement);
        draggingElement.style.position = 'absolute';
        draggingElement.style.zIndex = '1000';

        const touch = e.touches[0];
        draggingElement.style.left = `${touch.clientX - draggingElement.offsetWidth / 2}px`;
        draggingElement.style.top = `${touch.clientY - draggingElement.offsetHeight / 2}px`;
        
        // 탱크 안의 복제된 추는 숨겨서 집어든 것처럼 보이게 함
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
    return totalVolume + getWeightVolume(weightElement); // ✨ Use helper
  }, 0);
  const totalVolumeMl = baseWaterLevelMl + addedVolumeMl;
  const totalHeight = totalVolumeMl * pxPerMl;
  waterLevel.style.height = totalHeight + 'px';
  updateVolumeDisplay();
}

// 부피 표시 업데이트
function updateVolumeDisplay() {
    const baseWaterLevelMl = parseInt(waterLevelSlider.value);
    const addedVolumeMl = weightsInTankIds.reduce((total, id) => {
        const el = document.querySelector(`[data-id="${id}"]`);
        return total + getWeightVolume(el); // ✨ Use helper
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

// 초기화
waterLevelValue.textContent = waterLevelSlider.value;
updateWaterLevel();