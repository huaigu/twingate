css_additions = """
/* 1:1 Layout Containers & Slices */
.v3Container1672 {
  max-width: 1672px;
  margin: 0 auto;
  padding: 1.5rem 2rem;
  position: relative;
}

/* Page 01: Profile Source Import 3-Col Layout */
.importPageGrid {
  display: grid;
  grid-template-columns: 360px 480px 1fr;
  gap: 2rem;
  align-items: start;
}

.importLeftCol {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.alexDeskWrapper {
  position: relative;
  margin-top: 1rem;
}

.alexDeskImg {
  width: 100%;
  max-width: 360px;
  border-radius: 12px;
  object-fit: contain;
  display: block;
}

.stickyShareImg {
  position: absolute;
  left: -10px;
  bottom: 80px;
  width: 150px;
  transform: rotate(-4deg);
  pointer-events: none;
}

/* Vertical Stepper for Page 01 */
.verticalStepper {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  position: relative;
  padding-left: 0.5rem;
}

.stepperItem {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  font-size: 1.05rem;
  color: #38342f;
}

.stepperNum {
  width: 28px;
  height: 28px;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
  border: 1.5px solid #2528ab;
  color: #2528ab;
}

.stepperNumActive {
  background: #2528ab;
  color: #ffffff;
}

.stepperLabelPill {
  background: #e0e7ff;
  color: #1e1b4b;
  font-weight: 600;
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
}

/* Page 02: Personal Agent Layout with Left Sidebar */
.agentPageGrid {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 2.5rem;
  align-items: start;
}

.agentSidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.verticalNavMenu {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  background: #fdfbf7;
  border: 1px solid #e2ddd3;
  border-radius: 12px;
  padding: 0.75rem 0.5rem;
  box-shadow: 0 4px 12px rgba(45, 30, 20, 0.04);
}

.navMenuItem {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.85rem;
  border-radius: 8px;
  text-decoration: none;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #4a453e;
  transition: all 0.15s ease;
}

.navMenuItem:hover {
  background: rgba(110, 91, 240, 0.06);
  color: #121016;
}

.navMenuItemActive {
  background: #ede9fe;
  color: #3b28cc;
  font-weight: 600;
}

.alexStandingSidebarImg {
  width: 100%;
  max-width: 240px;
  object-fit: contain;
}

/* Page 03: People Discovery 3-Col Layout */
.discoverGrid1672 {
  display: grid;
  grid-template-columns: 280px 1fr 280px;
  gap: 2rem;
  align-items: start;
}

.discoverLeftCol {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.alexSittingImg {
  width: 100%;
  max-width: 280px;
  object-fit: contain;
  border-radius: 12px;
}

.rohanStandingImg {
  width: 100%;
  max-width: 280px;
  object-fit: contain;
  border-radius: 12px;
}

/* Page 04: Widget Creator Layout */
.widgetGrid1672 {
  display: grid;
  grid-template-columns: 560px 1fr;
  gap: 3rem;
  align-items: start;
}

.widgetPreviewTablet {
  background: #fdfbf7;
  border: 1px solid #d9d2c5;
  border-radius: 20px;
  padding: 2.25rem;
  box-shadow: 0 20px 50px rgba(45, 30, 20, 0.09), 0 2px 8px rgba(45, 30, 20, 0.04);
  position: relative;
}

/* Page 05: Composer 3-Col Layout */
.composerGrid1672 {
  display: grid;
  grid-template-columns: 250px 1fr 1fr;
  gap: 2.25rem;
  align-items: start;
}

/* Page 06: Inbox 3-Col Layout */
.inboxGrid1672 {
  display: grid;
  grid-template-columns: 260px 380px 1fr 280px;
  gap: 1.75rem;
  align-items: start;
}

.rohanSittingImg {
  width: 100%;
  max-width: 280px;
  object-fit: contain;
}

/* Bottom Actions & Floating Notes */
.floatingNoteSlice {
  display: block;
  object-fit: contain;
  pointer-events: none;
}

.bottomActionRow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 2.5rem;
  position: relative;
}

.btnPrimaryBlue {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.85rem 2.25rem;
  background: #1b1f9b;
  color: #ffffff !important;
  font-size: 1.05rem;
  font-weight: 600;
  border-radius: 9999px;
  text-decoration: none;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(27, 31, 155, 0.3);
  transition: all 0.2s ease;
}

.btnPrimaryBlue:hover {
  background: #13167a;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(27, 31, 155, 0.4);
}

.btnSecondaryCream {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.85rem 2rem;
  background: #fdfbf7;
  color: #38342f !important;
  font-size: 1.05rem;
  font-weight: 600;
  border-radius: 9999px;
  text-decoration: none;
  border: 1px solid #c9c2b4;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(45, 30, 20, 0.05);
  transition: all 0.2s ease;
}

.btnSecondaryCream:hover {
  background: #f7f3ec;
  border-color: #a89f8f;
  transform: translateY(-2px);
}

@media (max-width: 1280px) {
  .importPageGrid {
    grid-template-columns: 1fr;
  }
  .agentPageGrid {
    grid-template-columns: 1fr;
  }
  .discoverGrid1672 {
    grid-template-columns: 1fr;
  }
  .widgetGrid1672 {
    grid-template-columns: 1fr;
  }
  .composerGrid1672 {
    grid-template-columns: 1fr;
  }
  .inboxGrid1672 {
    grid-template-columns: 1fr;
  }
  .rohanStandingImg, .rohanSittingImg, .alexSittingImg, .alexStandingSidebarImg {
    display: none;
  }
}
"""

with open('apps/web/app/v3.module.css', 'a') as f:
    f.write(css_additions)

print('Added 1:1 classes to apps/web/app/v3.module.css')
