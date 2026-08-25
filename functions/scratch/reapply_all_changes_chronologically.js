const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.join(__dirname, '../..');

// 1. Revert target files to clean origin/main state
console.log("1. Reverting target files to clean origin/main state...");
execSync('git checkout origin/main -- functions/public/pages/AgentDashboard.tsx', { cwd: rootDir });
execSync('git checkout origin/main -- functions/public/components/admin/KostManagerManagement.tsx', { cwd: rootDir });

const scripts = [
  // A. Dokumen Penghuni removal
  'functions/scratch/remove_dokumen_penghuni_entirely_fixed.js',
  
  // B. Room photos optional for occupied and moved outside conditional
  'functions/scratch/make_room_photos_optional_for_occupied.js',
  'functions/scratch/move_room_photos_outside_conditional_final.js',
  
  // C. Reorganize status inside Detail Kamar (making it progressive and clean)
  'functions/scratch/reorganize_status_inside_detail_kamar_fixed.js',
  
  // D. Validations of total rooms, draft buttons, floor neutralizing, and copying room data
  'functions/scratch/implement_total_rooms_acuan_flexible.js',
  'functions/scratch/disable_add_room_button_on_limit_index.js',
  'functions/scratch/neutralize_room_floor.js',
  'functions/scratch/add_copy_room_data_feature.js',
  
  // E. Remove ready date completely
  'functions/scratch/remove_ready_date_properly.js',
  
  // F. Photo categories kustom & unlimited
  'functions/scratch/make_room_photos_unlimited.js',
  'functions/scratch/replace_photos_blocks_by_index.js',
  
  // G. Replace view_jendela with tempat_tidur
  'functions/scratch/replace_view_jendela.js',
  
  // H. Kitchen facilities checkbox and nested inputs
  'functions/scratch/add_kitchen_facilities_correctly.js',
  
  // I. Onboarding URL routing and draft auto-save
  'functions/scratch/implement_onboarding_routing.js',
  'functions/scratch/fix_onboarding_draft_merging.js',
  
  // J. Price inputs formatting
  'functions/scratch/replace_price_inputs_robustly.js',
  'functions/scratch/fix_thousand_formatting_final.js',
  'functions/scratch/fix_recursive_close.js',
  
  // K. Reposition occupants inputs to pricing section
  'functions/scratch/move_occupants_to_pricing.js',
  
  // L. Apply unlimited room photos categories fixed
  'functions/scratch/apply_unlimited_photos_fixed.js',

  'functions/scratch/add_pricing_fees_to_rooms.js',
  'functions/scratch/fix_invalid_ternary_else.js',
  'functions/scratch/rebuild_layout_cleanly.js',
  'functions/scratch/remove_duplicate_close_and_effects.js',
  'functions/scratch/implement_review_page.js',
  'functions/scratch/reorder_step1_sections.js',
  'functions/scratch/add_landmark_search.js',
  'functions/scratch/add_landmark_autocomplete.js',
  'functions/scratch/auto_correct_default_location.js',
  'functions/scratch/fix_draft_corruption.js',
  'functions/scratch/fix_draft_race_condition.js',
  'functions/scratch/make_room_types_empty_by_default.js',
  'functions/scratch/fix_leaflet_race_condition.js',
  'functions/scratch/add_public_kitchen_and_bathroom_sub_inputs.js',
  'functions/scratch/remove_duplicate_keys.js',
  'functions/scratch/fix_leaflet_recreation.js',
  'functions/scratch/fix_max_occupants_empty.js',
  'functions/scratch/make_payment_period_flexible.js',
  'functions/scratch/remove_payment_status_from_occupants.js',
  'functions/scratch/make_room_list_accordion.js',
  'functions/scratch/separate_kostmanager_rooms.js',
  'functions/scratch/sanitize_draft_prefilled_rooms.js',
  'functions/scratch/fix_step3_dollars_and_escapes.js',
  'functions/scratch/fix_step3_dollars_and_escapes_cleanup.js',
  'functions/scratch/improve_review_details.js',
  'functions/scratch/auto_extract_landmark_name.js',
  'functions/scratch/landmark_input_choice_fixed.js',
  'functions/scratch/landmark_invalidate_size_on_method_change.js',
  'functions/scratch/fix_landmark_choice_styles.js',
  'functions/scratch/fix_unclosed_div.js',
  'functions/scratch/change_kostmanager_submit_to_draft.js',
  'functions/scratch/change_agent_payload_exclude_metadata.js',
  'functions/scratch/add_admin_review_kostmanager.js',
  'functions/scratch/fix_properties_metadata_error.js',
  'functions/scratch/add_current_and_additional_occupants_ordered.js',
  'functions/scratch/move_submitted_to_active_tab.js',
  'functions/scratch/show_lihat_detail_for_submitted_active.js',
  'functions/scratch/load_from_mitra_kostmanager_first.js',

  // N. Warning overlay for migrating existing properties (absolute overlay, safe approach)
  'functions/scratch/add_warning_overlay.js',

  // N2. State variables and UUID guard for warning popup
  'functions/scratch/fix_missing_states_and_uuid.js',
  'functions/scratch/fix_onboarding_loading_discrepancy.js',

  // O. Premium segmented switcher for Kosongan vs Furnished
  'functions/scratch/apply_segmented_kosongan_v5.js',

  // P. Dynamic GPS Coordinates & initialTotalRooms extractor and prefill
  'functions/scratch/add_auto_resolve_coords.js',
  'functions/scratch/apply_gps_fixes_v2.js',

  // Q. Disable scroll wheel zoom to prevent wheel unmount crash
  'functions/scratch/disable_scroll_wheel_zoom.js',

  // R. Premium Card Layout for task list cards
  'functions/scratch/apply_premium_card_layout.js',

  // S. Premium Card Layout and pipeline tabs for admin KostManager orders management
  'functions/scratch/apply_admin_premium_layout.js'
];

scripts.forEach(script => {
  const scriptPath = path.join(rootDir, script);
  if (!fs.existsSync(scriptPath)) {
    console.error(`Script not found: ${script}`);
    process.exit(1);
  }
  console.log(`Running script: ${script}...`);
  try {
    const output = execSync(`node "${scriptPath}"`, { cwd: rootDir });
    console.log(output.toString().trim());
  } catch (err) {
    console.error(`Error running ${script}:`, err.message);
    process.exit(1);
  }
});

console.log("\nALL SCRIPTS APPLIED SUCCESSFULLY!");
