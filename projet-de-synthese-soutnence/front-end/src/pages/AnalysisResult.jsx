import React from 'react';
import './AnalysisResult.css';
import { useLanguage } from '../context/LanguageContext';

const AnalysisResult = () => {
    const { language, t } = useLanguage();
    const dir = (language === 'en' || language === 'fr') ? 'ltr' : 'rtl';
    const dateFormatted = language === 'en' ? '14 March 2025' : language === 'fr' ? '14 mars 2025' : '14 مارس 2025';

    return (
        <div className="analysis-page" dir={dir}>
            <div className="analysis-container">
                <header className="analysis-header">
                    <span className="analysis-badge">{t('aiAnalysis')}</span>
                    <h1 className="analysis-title">{t('analysisResultCommercialRent')}</h1>
                    <p className="analysis-subtitle">{t('reviewedOnDate').replace('{date}', dateFormatted)}</p>
                </header>

                <div className="analysis-grid">
                    {/* Summary Section */}
                    <div className="analysis-section summary">
                        <div className="section-icon">📜</div>
                        <div className="section-content">
                            <h3>{t('generalSummary')}</h3>
                            <p>{t('contractSummaryDesc')}</p>
                        </div>
                    </div>

                    {/* Risks Section */}
                    <div className="analysis-section risks">
                        <div className="section-icon">⚠️</div>
                        <div className="section-content">
                            <h3>{t('legalRisks')}</h3>
                            <ul className="risks-list">
                                <li className="risk-high">
                                    {t('riskHighArticle4')}
                                </li>
                                <li className="risk-medium">
                                    {t('riskMediumArticle12')}
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Recommendations Section */}
                    <div className="analysis-section solutions">
                        <div className="section-icon">✅</div>
                        <div className="section-content">
                            <h3>{t('proposedRecommendations')}</h3>
                            <p>{t('recommendationArticle4Desc')}</p>
                        </div>
                    </div>

                    {/* Lawyer CTA */}
                    <div className="lawyer-cta-card">
                        <div className="cta-info">
                            <h3>{t('reviewWithLawyer')}</h3>
                            <p>{t('connectWithLawyerDesc')}</p>
                        </div>
                        <button className="cta-btn">{t('bookWithLawyer')}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalysisResult;
