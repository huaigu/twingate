from PIL import Image
import os

out_dir = 'apps/web/public/design/slices'
os.makedirs(out_dir, exist_ok=True)

im1 = Image.open('design-explorations/signalpass-v3/01-profile-source-import.png')
im2 = Image.open('design-explorations/signalpass-v3/02-personal-agent-privacy.png')
im3 = Image.open('design-explorations/signalpass-v3/03-people-discovery.png')
im4 = Image.open('design-explorations/signalpass-v3/04-profile-widget.png')
im5 = Image.open('design-explorations/signalpass-v3/05-introduction-composer.png')
im6 = Image.open('design-explorations/signalpass-v3/06-recipient-inbox.png')

print("1. Slicing Page 01 (Profile Source Import)...")
# Full left hero art panel (title, stepper, Alex at desk, mug, plant, scraps)
im1.crop((0, 95, 612, 941)).save(os.path.join(out_dir, '01_left_hero_art.png'))
# Desk scene alone
im1.crop((0, 310, 612, 941)).save(os.path.join(out_dir, '01_alex_desk_scene.png'))
# Sticky notes and scraps
im1.crop((10, 640, 185, 755)).save(os.path.join(out_dir, 'sticky_control_share.png'))
im1.crop((0, 755, 230, 941)).save(os.path.join(out_dir, 'scrap_more_open_internet.png'))
im1.crop((580, 835, 775, 960)).save(os.path.join(out_dir, 'sticky_public_info.png'))
im1.crop((1440, 740, 1672, 941)).save(os.path.join(out_dir, 'scrap_purple_monad.png'))
im1.crop((1435, 25, 1665, 140)).save(os.path.join(out_dir, 'note_your_agent_writes.png'))
im1.crop((1560, 190, 1672, 320)).save(os.path.join(out_dir, 'note_first_look.png'))
# Alex avatar
im1.crop((640, 245, 735, 385)).save(os.path.join(out_dir, 'avatar_alex_3d.png'))

print("2. Slicing Page 02 (Personal Agent Privacy)...")
# Full left sidebar art column (nav links, Alex standing with notebook, plant, scraps)
im2.crop((0, 100, 350, 941)).save(os.path.join(out_dir, '02_left_sidebar_art.png'))
# Handnotes and scraps
im2.crop((1120, 115, 1285, 205)).save(os.path.join(out_dir, 'note_privacy_connection.png'))
im2.crop((1540, 290, 1665, 430)).save(os.path.join(out_dir, 'note_good_matches.png'))
im2.crop((1470, 580, 1620, 730)).save(os.path.join(out_dir, 'note_you_choose.png'))
im2.crop((1400, 730, 1672, 941)).save(os.path.join(out_dir, 'scrap_arch_and_purple.png'))
im2.crop((900, 790, 1000, 860)).save(os.path.join(out_dir, 'note_glimpse_not_everything.png'))

print("3. Slicing Page 03 (People Discovery)...")
# Left Alex sitting
im3.crop((0, 380, 440, 941)).save(os.path.join(out_dir, 'alex_sitting_thinking.png'))
# Right Rohan standing
im3.crop((1400, 150, 1672, 941)).save(os.path.join(out_dir, 'rohan_standing_monad.png'))
# Notes from im3
im3.crop((310, 235, 440, 370)).save(os.path.join(out_dir, 'note_new_perspectives.png'))
im3.crop((55, 615, 175, 740)).save(os.path.join(out_dir, 'note_ideas_people.png'))
im3.crop((1015, 400, 1280, 448)).save(os.path.join(out_dir, 'note_suggestions_ranking.png'))
im3.crop((1330, 160, 1470, 330)).save(os.path.join(out_dir, 'note_agent_finds_people.png'))
# Candidate avatars
im3.crop((295, 490, 370, 615)).save(os.path.join(out_dir, 'avatar_maya_candidate.png'))
im3.crop((485, 490, 555, 615)).save(os.path.join(out_dir, 'avatar_rohan_candidate.png'))
im3.crop((665, 490, 745, 615)).save(os.path.join(out_dir, 'avatar_leo_candidate.png'))

print("4. Slicing Page 04 (Profile Widget)...")
im4.crop((0, 580, 160, 830)).save(os.path.join(out_dir, 'plant_corner_left.png'))
im4.crop((10, 830, 185, 960)).save(os.path.join(out_dir, 'scrap_same_builders.png'))
im4.crop((1340, 70, 1672, 310)).save(os.path.join(out_dir, 'scrap_mountain_arch.png'))
im4.crop((1125, 140, 1340, 250)).save(os.path.join(out_dir, 'note_small_intros.png'))
im4.crop((1520, 410, 1672, 610)).save(os.path.join(out_dir, 'note_card_brings_conversations.png'))
im4.crop((15, 380, 100, 550)).save(os.path.join(out_dir, 'note_your_people_can_find.png'))
# Widget live preview card
im4.crop((860, 270, 1530, 715)).save(os.path.join(out_dir, 'widget_preview_card_alex.png'))
# Persona pickers
im4.crop((180, 360, 298, 495)).save(os.path.join(out_dir, 'persona_picker_alex.png'))
im4.crop((326, 360, 444, 495)).save(os.path.join(out_dir, 'persona_picker_rohan.png'))
im4.crop((472, 360, 590, 495)).save(os.path.join(out_dir, 'persona_picker_beanie.png'))
im4.crop((618, 360, 736, 495)).save(os.path.join(out_dir, 'persona_picker_none.png'))

print("5. Slicing Page 05 (Introduction Composer)...")
# Alex standing clean without any card bleed
im5.crop((0, 245, 256, 941)).save(os.path.join(out_dir, 'alex_standing_isolated.png'))
im5.crop((0, 245, 256, 941)).save(os.path.join(out_dir, 'alex_standing_notebook.png'))
im5.crop((855, 385, 1180, 565)).save(os.path.join(out_dir, 'venn_center_badge.png'))
im5.crop((1435, 100, 1672, 941)).save(os.path.join(out_dir, 'p5_right_collage.png'))
im5.crop((1440, 140, 1650, 350)).save(os.path.join(out_dir, 'note_approve_before_shared.png'))

print("6. Slicing Page 06 (Recipient Inbox)...")
# Clean Alex sitting on left
im6.crop((0, 270, 195, 941)).save(os.path.join(out_dir, 'alex_sitting_inbox.png'))
# Clean Rohan sitting on right
im6.crop((1405, 100, 1672, 941)).save(os.path.join(out_dir, 'p6_right_column_clean.png'))
im6.crop((1400, 440, 1672, 941)).save(os.path.join(out_dir, 'rohan_sitting_mug_full.png'))
im6.crop((1420, 110, 1672, 235)).save(os.path.join(out_dir, 'p6_note_perspectives.png'))
im6.crop((1400, 235, 1672, 530)).save(os.path.join(out_dir, 'p6_scrap_arch.png'))
im6.crop((465, 240, 545, 360)).save(os.path.join(out_dir, 'note_alex_reached_out.png'))
im6.crop((785, 240, 860, 360)).save(os.path.join(out_dir, 'note_this_is_you.png'))

# Brushstrokes
im1.crop((70, 360, 330, 395)).save(os.path.join(out_dir, 'brushstroke_profile.png'))
im2.crop((445, 155, 620, 180)).save(os.path.join(out_dir, 'brushstroke_agent.png'))
im3.crop((48, 418, 235, 442)).save(os.path.join(out_dir, 'brushstroke_knowing.png'))
im4.crop((70, 222, 390, 250)).save(os.path.join(out_dir, 'brushstroke_profile_widget.png'))
im5.crop((235, 205, 475, 240)).save(os.path.join(out_dir, 'brushstroke_first_hello.png'))
im6.crop((50, 190, 430, 225)).save(os.path.join(out_dir, 'brushstroke_introductions.png'))

print("All slices generated successfully!")
