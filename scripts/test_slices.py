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

# 1. Alex at desk scene (from im1)
# Bounding box roughly: Alex, desk, laptop, plant, mug, shoes
im1.crop((110, 310, 630, 941)).save(os.path.join(out_dir, 'alex_desk_scene.png'))

# 2. Alex standing with notebook (from im2)
im2.crop((40, 180, 360, 941)).save(os.path.join(out_dir, 'alex_standing_notebook.png'))

# 3. Alex sitting thinking (from im3)
im3.crop((80, 420, 430, 941)).save(os.path.join(out_dir, 'alex_sitting_thinking.png'))

# 4. Rohan standing monad (from im3)
im3.crop((1360, 240, 1620, 941)).save(os.path.join(out_dir, 'rohan_standing_monad.png'))

# 5. Rohan sitting holding mug (from im6)
im6.crop((1380, 440, 1672, 941)).save(os.path.join(out_dir, 'rohan_sitting_mug.png'))

# 6. Sticky notes and decorative scraps
im1.crop((10, 640, 185, 755)).save(os.path.join(out_dir, 'sticky_control_share.png'))
im1.crop((590, 835, 765, 960)).save(os.path.join(out_dir, 'sticky_public_info.png'))
im1.crop((1440, 740, 1672, 941)).save(os.path.join(out_dir, 'scrap_purple_monad.png'))
im1.crop((1435, 30, 1645, 140)).save(os.path.join(out_dir, 'note_your_agent_writes.png'))
im1.crop((1560, 190, 1672, 320)).save(os.path.join(out_dir, 'note_first_look.png'))

# 7. Slices from im2
im2.crop((1120, 115, 1285, 205)).save(os.path.join(out_dir, 'note_privacy_connection.png'))
im2.crop((1540, 290, 1665, 430)).save(os.path.join(out_dir, 'note_good_matches.png'))
im2.crop((1470, 580, 1620, 730)).save(os.path.join(out_dir, 'note_you_choose.png'))

# 8. Slices from im3
im3.crop((310, 235, 440, 370)).save(os.path.join(out_dir, 'note_new_perspectives.png'))
im3.crop((55, 615, 175, 740)).save(os.path.join(out_dir, 'note_ideas_people.png'))
im3.crop((1015, 400, 1280, 448)).save(os.path.join(out_dir, 'note_suggestions_ranking.png'))
im3.crop((1330, 160, 1470, 330)).save(os.path.join(out_dir, 'note_agent_finds_people.png'))
im3.crop((1500, 215, 1672, 300)).save(os.path.join(out_dir, 'note_real_conversations.png'))
im3.crop((1510, 515, 1672, 715)).save(os.path.join(out_dir, 'scrap_builders_creators.png'))

# 9. Slices from im4
im4.crop((0, 580, 160, 830)).save(os.path.join(out_dir, 'plant_corner_left.png'))
im4.crop((10, 830, 185, 960)).save(os.path.join(out_dir, 'scrap_same_builders.png'))
im4.crop((1340, 70, 1672, 310)).save(os.path.join(out_dir, 'scrap_mountain_arch.png'))
im4.crop((1125, 140, 1340, 250)).save(os.path.join(out_dir, 'note_small_intros.png'))
im4.crop((1520, 410, 1672, 610)).save(os.path.join(out_dir, 'note_card_brings_conversations.png'))

# 10. Orange brushstrokes
im1.crop((70, 360, 330, 395)).save(os.path.join(out_dir, 'brushstroke_profile.png'))

print('Test slices saved successfully!')
